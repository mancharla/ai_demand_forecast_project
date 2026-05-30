import os
import json
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Forecast, Notification
from app.utils.dependencies import get_current_user
from app.services.forecasting import generate_product_forecast
from app.services.activity_logger import log_activity
from app.services.model_retraining import retrain_dataset_model
from app.services.model_comparison import compare_forecasting_models
from app.services.cache import clear_cache
from app.services.email_service import send_email_notification


router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"],
)

UPLOAD_DIR = "uploads"


@router.post("/{dataset_id}")
def generate_forecast(
    dataset_id: int,
    days: int = Query(30),
    model_type: str = Query("best"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == current_user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    file_path = os.path.join(UPLOAD_DIR, dataset.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    try:
        if dataset.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        result = generate_product_forecast(
            df,
            forecast_days=days,
        )

        product_forecasts = result["product_forecasts"]

        # Map model comparison metrics so we can store mae/rmse/mape per forecast
        metrics_map = {}
        for mc in result.get("model_comparison", []):
            metrics_map[mc.get("model_name")] = {
                "mae": mc.get("mae"),
                "rmse": mc.get("rmse"),
                "mape": mc.get("mape"),
            }

        for item in product_forecasts:
            model_name = item.get("model_used")
            model_metrics = metrics_map.get(model_name, {})

            forecast = Forecast(
                model_name=model_name,
                target_column="Sales",
                mae=model_metrics.get("mae"),
                rmse=model_metrics.get("rmse"),
                mape=model_metrics.get("mape"),
                forecast_values=json.dumps(item),
                user_id=current_user.id,
                dataset_id=dataset.id,
            )

            db.add(forecast)

        notification = Notification(
            user_id=current_user.id,
            message="Forecast generation completed successfully",
            type="success",
        )
        clear_cache()

        db.add(notification)

        log_activity(
            db=db,
            user_id=current_user.id,
            action="FORECAST_GENERATED",
            description=f"Generated forecast for dataset {dataset.id}",
            module="Forecast",
        )

        db.commit()

        city_wise_sales = {}

        if "Region" in df.columns and "Sales" in df.columns:
            city_wise_sales = (
                df.groupby("Region")["Sales"]
                .sum()
                .to_dict()
            )

        monthly_sales = {}

        if "Date" in df.columns and "Sales" in df.columns:
            df["Date"] = pd.to_datetime(
                df["Date"],
                errors="coerce",
            )

            valid_dates = df.dropna(subset=["Date"]).copy()
            valid_dates["Month"] = valid_dates["Date"].dt.strftime(
                "%Y-%m"
            )

            monthly_sales = (
                valid_dates.groupby("Month")["Sales"]
                .sum()
                .to_dict()
            )

        inventory_recommendations = []

        for item in product_forecasts:
            if item["predicted_sales"] > 10000:
                recommendation = "Increase Inventory"
            elif item["predicted_sales"] < 3000:
                recommendation = "Reduce Inventory"
            else:
                recommendation = "Maintain Inventory"

            inventory_recommendations.append(
                {
                    "product": item["product"],
                    "recommendation": recommendation,
                }
            )

        return {
            "message": "Forecast generated successfully",
            "top_demand_product": result["top_demand_product"],
            "model_used": result["model_used"],
            "product_forecasts": product_forecasts,
            "city_wise_sales": city_wise_sales,
            "monthly_sales": monthly_sales,
            "inventory_recommendations": inventory_recommendations,
            "model_comparison": result["model_comparison"],
        }

    except Exception as e:
        notification = Notification(
            user_id=current_user.id,
            message="Forecast generation failed",
            type="error",
        )

        db.add(notification)
        send_email_notification(
            to_email=current_user.email,
            subject="Forecast Generation Failed",
            message=(
                f"Hello {current_user.name},\n\n"
                f"Your forecast generation failed.\n\n"
                f"Dataset ID: {dataset.id}\n"
                f"Error: {str(e)}\n\n"
                f"Please check your dataset format and try again."
            ),
        )

        log_activity(
            db=db,
            user_id=current_user.id,
            action="FORECAST_FAILED",
            description=f"Forecast failed for dataset {dataset.id}",
            module="Forecast",
        )

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/history/my-history")
def get_my_forecast_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(
            Forecast.user_id == current_user.id,
            ~Forecast.forecast_values.like("%model_comparison_metric%"),
        )
        .order_by(Forecast.created_at.desc())
        .all()
    )

    history = []

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        history.append(
            {
                "id": forecast.id,
                "dataset_id": forecast.dataset_id,
                "model_name": forecast.model_name,
                "forecast_days": value.get("days", 30),
                "top_demand_product": (
                    value.get("product")
                    or value.get("product_name")
                    or value.get("top_product")
                    or "N/A"
                ),
                "created_at": forecast.created_at,
            }
        )

    return history
@router.get("/metrics/my-metrics")
def get_my_accuracy_metrics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(
            Forecast.user_id == current_user.id,
            Forecast.forecast_values.like("%model_comparison_metric%"),
        )
        .order_by(Forecast.created_at.desc())
        .all()
    )

    metrics = []

    for forecast in forecasts:
        metrics.append(
            {
                "id": forecast.id,
                "dataset_id": forecast.dataset_id,
                "model_name": forecast.model_name,
                "mae": forecast.mae or 0,
                "rmse": forecast.rmse or 0,
                "mape": forecast.mape or 0,
                "accuracy": forecast.accuracy or 0,
                "created_at": forecast.created_at,
            }
        )

    return metrics@router.post("/retrain/all")
def retrain_all_models(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .all()
    )

    results = []

    for dataset in datasets:
        result = retrain_dataset_model(dataset)
        results.append(result)

    notification = Notification(
        user_id=current_user.id,
        message="Automated model retraining completed",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MODEL_RETRAINING",
        description="Retrained models for all available datasets",
        module="Forecast",
    )

    db.commit()

    return {
        "message": "Model retraining completed",
        "results": results,
    }
@router.get("/compare-models/{dataset_id}")
def compare_models(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    dataset = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id)
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    file_path = os.path.join(
        "uploads",
        dataset.filename,
    )

    if dataset.filename.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    result = compare_forecasting_models(df)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MODEL_COMPARISON",
        description=f"Compared forecasting models for dataset {dataset.id}",
        module="Forecast",
    )

    return result