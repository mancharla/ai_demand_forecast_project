import os
import json
import pandas as pd

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Forecast
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

UPLOAD_DIR = "uploads"


@router.get("/forecast-analysis")
def forecast_analysis(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    category: str | None = Query(None),
    region: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .all()
    )

    all_frames = []

    for dataset in datasets:
        file_path = os.path.join(UPLOAD_DIR, dataset.filename)

        if not os.path.exists(file_path):
            continue

        try:
            if dataset.filename.endswith(".csv"):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            all_frames.append(df)

        except Exception:
            continue

    if not all_frames:
        return empty_dashboard_response()

    df = pd.concat(all_frames, ignore_index=True)

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    if "Sales" in df.columns:
        df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce").fillna(0)

    if start_date and "Date" in df.columns:
        df = df[df["Date"] >= pd.to_datetime(start_date)]

    if end_date and "Date" in df.columns:
        df = df[df["Date"] <= pd.to_datetime(end_date)]

    if category and "Category" in df.columns:
        df = df[df["Category"] == category]

    if region and "Region" in df.columns:
        df = df[df["Region"] == region]

    categories = (
        sorted(df["Category"].dropna().unique().tolist())
        if "Category" in df.columns
        else []
    )

    regions = (
        sorted(df["Region"].dropna().unique().tolist())
        if "Region" in df.columns
        else []
    )

    product_sales = []

    if "Product" in df.columns and "Sales" in df.columns:
        product_sales = (
            df.groupby("Product")["Sales"]
            .sum()
            .reset_index()
            .rename(columns={"Product": "product", "Sales": "sales"})
            .to_dict(orient="records")
        )

    category_sales = []

    if "Category" in df.columns and "Sales" in df.columns:
        category_sales = (
            df.groupby("Category")["Sales"]
            .sum()
            .reset_index()
            .rename(columns={"Category": "category", "Sales": "sales"})
            .to_dict(orient="records")
        )

    region_sales = []

    if "Region" in df.columns and "Sales" in df.columns:
        region_sales = (
            df.groupby("Region")["Sales"]
            .sum()
            .reset_index()
            .rename(columns={"Region": "region", "Sales": "sales"})
            .to_dict(orient="records")
        )

    monthly_sales = []

    if "Date" in df.columns and "Sales" in df.columns:
        valid_df = df.dropna(subset=["Date"]).copy()
        valid_df["month"] = valid_df["Date"].dt.strftime("%Y-%m")

        monthly_sales = (
            valid_df.groupby("month")["Sales"]
            .sum()
            .reset_index()
            .rename(columns={"Sales": "sales"})
            .to_dict(orient="records")
        )

    forecasts = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .limit(10)
        .all()
    )

    forecast_vs_actual = []
    recent_activity = []

    for forecast in forecasts:
        value = {}

        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        product = value.get("product", "N/A")
        predicted = value.get("predicted_sales", 0)

        forecast_vs_actual.append(
            {
                "product": product,
                "actual": 0,
                "forecast": predicted,
            }
        )

        recent_activity.append(
            {
                "id": forecast.id,
                "product_name": product,
                "predicted_sales": predicted,
                "dataset_id": forecast.dataset_id,
            }
        )

    total_sales = float(df["Sales"].sum()) if "Sales" in df.columns else 0

    top_product = "N/A"

    if product_sales:
        top_product = max(
            product_sales,
            key=lambda x: x["sales"],
        )["product"]

    summary = {
        "total_products": int(df["Product"].nunique())
        if "Product" in df.columns
        else 0,
        "total_regions": int(df["Region"].nunique())
        if "Region" in df.columns
        else 0,
        "total_sales": round(total_sales, 2),
        "top_product": top_product,
    }

    return {
        "summary": summary,
        "filters": {
            "categories": categories,
            "regions": regions,
        },
        "product_sales": product_sales,
        "region_sales": region_sales,
        "category_sales": category_sales,
        "monthly_sales": monthly_sales,
        "forecast_vs_actual": forecast_vs_actual,
        "recent_activity": recent_activity,
    }


def empty_dashboard_response():
    return {
        "summary": {
            "total_products": 0,
            "total_regions": 0,
            "total_sales": 0,
            "top_product": "N/A",
        },
        "filters": {
            "categories": [],
            "regions": [],
        },
        "product_sales": [],
        "region_sales": [],
        "category_sales": [],
        "monthly_sales": [],
        "forecast_vs_actual": [],
        "recent_activity": [],
    }