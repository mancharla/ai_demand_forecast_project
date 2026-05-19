# app/routers/forecast.py

import os
import pandas as pd
import numpy as np

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.models.user import User
from app.models.notification import Notification
from app.models.forecast_history import ForecastHistory
from app.models.accuracy_metric import AccuracyMetric
from app.utils.security import verify_token


router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"]
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session
):
    token = credentials.credentials
    email = verify_token(token)

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def calculate_mape(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    non_zero = y_true != 0

    if not non_zero.any():
        return 0.0

    return float(
        round(
            np.mean(
                np.abs(
                    (y_true[non_zero] - y_pred[non_zero])
                    /
                    y_true[non_zero]
                )
            ) * 100,
            2
        )
    )


@router.post("/{dataset_id}")
def generate_forecast(
    dataset_id: int,
    days: int = 7,
    model_type: str = "best",
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    if days not in [7, 15, 30]:
        raise HTTPException(
            status_code=400,
            detail="Forecast days must be 7, 15, or 30"
        )

    if model_type not in ["best", "linear_regression", "random_forest"]:
        raise HTTPException(
            status_code=400,
            detail="model_type must be best, linear_regression, or random_forest"
        )

    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user.id
    ).first()

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found for this user"
        )

    if not os.path.exists(dataset.file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file missing"
        )

    try:
        if dataset.file_path.endswith(".csv"):
            df = pd.read_csv(dataset.file_path)
        else:
            df = pd.read_excel(dataset.file_path)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read dataset"
        )

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.replace("\ufeff", "", regex=False)
    )

    required_columns = ["Date", "Product", "Sales"]

    for column in required_columns:
        if column not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"{column} column missing. Found columns: {df.columns.tolist()}"
            )

    if "Region" not in df.columns:
        df["Region"] = "Unknown"

    try:
        df["Date"] = pd.to_datetime(df["Date"])

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid Date column"
        )

    try:
        df["Sales"] = pd.to_numeric(df["Sales"])

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Sales column must be numeric"
        )

    df = df.dropna(subset=["Date", "Product", "Sales"])

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Dataset contains no valid rows"
        )

    df["Month"] = df["Date"].dt.strftime("%Y-%m")

    db.query(Forecast).filter(
        Forecast.dataset_id == dataset.id
    ).delete()

    db.query(AccuracyMetric).filter(
        AccuracyMetric.dataset_id == dataset.id,
        AccuracyMetric.user_id == user.id
    ).delete()

    product_forecasts = []
    model_comparison = []

    grouped_products = df.groupby("Product")

    for product_name, product_df in grouped_products:
        product_df = product_df.sort_values("Date")

        if len(product_df) < 3:
            avg_prediction = float(
                round(product_df["Sales"].mean(), 2)
            )

            selected_model_name = "simple_average"

            mae = 0.0
            rmse = 0.0
            mape = 0.0

        else:
            X = np.arange(len(product_df)).reshape(-1, 1)
            y = product_df["Sales"].values

            split_index = max(1, int(len(product_df) * 0.8))

            X_train = X[:split_index]
            X_test = X[split_index:]

            y_train = y[:split_index]
            y_test = y[split_index:]

            if len(X_test) == 0:
                X_test = X_train
                y_test = y_train

            models = {
                "linear_regression": LinearRegression(),
                "random_forest": RandomForestRegressor(
                    n_estimators=100,
                    random_state=42
                )
            }

            product_model_results = []

            for name, model in models.items():
                model.fit(X_train, y_train)

                test_pred = model.predict(X_test)
                test_pred = np.maximum(test_pred, 0)

                current_mae = float(
                    round(
                        mean_absolute_error(y_test, test_pred),
                        2
                    )
                )

                current_rmse = float(
                    round(
                        np.sqrt(
                            mean_squared_error(y_test, test_pred)
                        ),
                        2
                    )
                )

                current_mape = calculate_mape(
                    y_test,
                    test_pred
                )

                product_model_results.append({
                    "model_name": name,
                    "mae": current_mae,
                    "rmse": current_rmse,
                    "mape": current_mape,
                    "model": model
                })

            if model_type == "best":
                best_model_result = min(
                    product_model_results,
                    key=lambda item: item["rmse"]
                )

            else:
                best_model_result = next(
                    item for item in product_model_results
                    if item["model_name"] == model_type
                )

            selected_model = best_model_result["model"]
            selected_model_name = best_model_result["model_name"]

            final_model = selected_model
            final_model.fit(X, y)

            future_days = np.arange(
                len(product_df),
                len(product_df) + days
            ).reshape(-1, 1)

            predictions = final_model.predict(future_days)
            predictions = np.maximum(predictions, 0)

            avg_prediction = float(
                round(
                    predictions.mean(),
                    2
                )
            )

            mae = best_model_result["mae"]
            rmse = best_model_result["rmse"]
            mape = best_model_result["mape"]

            for result in product_model_results:
                model_comparison.append({
                    "product": str(product_name),
                    "model_name": result["model_name"],
                    "mae": result["mae"],
                    "rmse": result["rmse"],
                    "mape": result["mape"]
                })

        forecast = Forecast(
            product_name=str(product_name),
            predicted_sales=avg_prediction,
            dataset_id=dataset.id
        )

        db.add(forecast)

        metric = AccuracyMetric(
            user_id=user.id,
            dataset_id=dataset.id,
            model_name=selected_model_name,
            mae=mae,
            rmse=rmse,
            mape=mape
        )

        db.add(metric)

        product_forecasts.append({
            "product": str(product_name),
            "predicted_sales": avg_prediction,
            "model_used": selected_model_name,
            "accuracy": {
                "mae": mae,
                "rmse": rmse,
                "mape": mape
            }
        })

    city_wise_sales = {}

    grouped_regions = df.groupby("Region")["Sales"].sum()

    for region, sales in grouped_regions.items():
        city_wise_sales[str(region)] = float(
            round(sales, 2)
        )

    monthly_sales = {}

    grouped_months = df.groupby("Month")["Sales"].sum()

    for month, sales in grouped_months.items():
        monthly_sales[str(month)] = float(
            round(sales, 2)
        )

    top_product = str(
        df.groupby("Product")["Sales"].sum().idxmax()
    )

    inventory_recommendations = []

    for item in product_forecasts:
        predicted = item["predicted_sales"]

        if predicted > 400:
            recommendation = "Increase Inventory"

        elif predicted < 100:
            recommendation = "Reduce Inventory"

        else:
            recommendation = "Normal Stock"

        inventory_recommendations.append({
            "product": item["product"],
            "recommendation": recommendation
        })

    history = ForecastHistory(
        user_id=user.id,
        dataset_id=dataset.id,
        model_name=model_type,
        forecast_days=days,
        top_demand_product=top_product
    )

    db.add(history)

    notification = Notification(
        user_id=user.id,
        title="Forecast Completed",
        message=f"Forecast generated successfully for dataset #{dataset.id}"
    )

    db.add(notification)

    db.commit()

    return {
        "message": "Advanced Forecast Generated Successfully",
        "selected_model_type": model_type,
        "forecast_days": days,
        "top_demand_product": top_product,
        "product_forecasts": product_forecasts,
        "model_comparison": model_comparison,
        "city_wise_sales": city_wise_sales,
        "monthly_sales": monthly_sales,
        "inventory_recommendations": inventory_recommendations
    }


@router.get("/history/my-history")
def get_my_forecast_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    history = (
        db.query(ForecastHistory)
        .filter(ForecastHistory.user_id == user.id)
        .order_by(ForecastHistory.id.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "dataset_id": item.dataset_id,
            "model_name": item.model_name,
            "forecast_days": item.forecast_days,
            "top_demand_product": item.top_demand_product,
            "created_at": str(item.created_at)
        }
        for item in history
    ]


@router.get("/metrics/my-metrics")
def get_my_accuracy_metrics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    metrics = (
        db.query(AccuracyMetric)
        .filter(AccuracyMetric.user_id == user.id)
        .order_by(AccuracyMetric.id.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "dataset_id": item.dataset_id,
            "model_name": item.model_name,
            "mae": item.mae,
            "rmse": item.rmse,
            "mape": item.mape,
            "created_at": str(item.created_at)
        }
        for item in metrics
    ]