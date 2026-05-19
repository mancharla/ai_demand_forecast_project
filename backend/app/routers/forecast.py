import os
import json
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Forecast, Notification
from app.utils.dependencies import get_current_user
from app.services.forecasting import generate_product_forecast

router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"]
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

    file_path = os.path.join(
        UPLOAD_DIR,
        dataset.filename,
    )

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

        for item in product_forecasts:
            forecast = Forecast(
                model_name=item["model_used"],
                target_column="Sales",
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

        db.add(notification)
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
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            valid_dates = df.dropna(subset=["Date"])
            valid_dates["Month"] = valid_dates["Date"].dt.strftime("%Y-%m")

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
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    history = []

    for forecast in forecasts:
        value = {}

        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        history.append(
            {
                "id": forecast.id,
                "dataset_id": forecast.dataset_id,
                "model_name": forecast.model_name,
                "forecast_days": 30,
                "top_demand_product": value.get("product", "N/A"),
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
        .filter(Forecast.user_id == current_user.id)
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
                "created_at": forecast.created_at,
            }
        )

    return metrics