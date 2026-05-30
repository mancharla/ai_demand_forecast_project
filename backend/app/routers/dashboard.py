import os
import json
import pandas as pd

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Forecast
from app.utils.dependencies import get_current_user

from app.services.anomaly_detection import detect_sales_anomalies
from app.services.seasonal_trends import detect_seasonal_trends
from app.services.business_insights import generate_business_insights
from app.services.cache import get_cache, set_cache

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

UPLOAD_DIR = "uploads"


def load_user_datasets(
    db: Session,
    user_id: int,
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user_id)
        .all()
    )

    all_frames = []

    for dataset in datasets:
        file_path = os.path.join(
            UPLOAD_DIR,
            dataset.filename,
        )

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
        return pd.DataFrame()

    return pd.concat(
        all_frames,
        ignore_index=True,
    )


def empty_dashboard_response():
    return {
        "summary": {
            "total_products": 0,
            "total_regions": 0,
            "total_outlets": 0,
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


@router.get("/forecast-analysis")
def forecast_analysis(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    category: str | None = Query(None),
    region: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cache_key = (
        f"dashboard:{current_user.id}:"
        f"{start_date}:{end_date}:{category}:{region}"
    )

    cached_data = get_cache(
        cache_key,
        expiry_seconds=60,
    )

    if cached_data:
        return cached_data

    df = load_user_datasets(
        db=db,
        user_id=current_user.id,
    )

    if df.empty:
        return empty_dashboard_response()

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce",
        )

    if "Sales" in df.columns:
        df["Sales"] = pd.to_numeric(
            df["Sales"],
            errors="coerce",
        ).fillna(0)

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
            .rename(
                columns={
                    "Product": "product",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    category_sales = []

    if "Category" in df.columns and "Sales" in df.columns:
        category_sales = (
            df.groupby("Category")["Sales"]
            .sum()
            .reset_index()
            .rename(
                columns={
                    "Category": "category",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    region_sales = []

    if "Region" in df.columns and "Sales" in df.columns:
        region_sales = (
            df.groupby("Region")["Sales"]
            .sum()
            .reset_index()
            .rename(
                columns={
                    "Region": "region",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    monthly_sales = []

    if "Date" in df.columns and "Sales" in df.columns:
        valid_df = df.dropna(subset=["Date"]).copy()

        valid_df["month"] = valid_df[
            "Date"
        ].dt.strftime("%Y-%m")

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
        try:
            value = json.loads(
                forecast.forecast_values or "{}"
            )
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

    total_sales = (
        float(df["Sales"].sum())
        if "Sales" in df.columns
        else 0
    )

    top_product = "N/A"

    if product_sales:
        top_product = max(
            product_sales,
            key=lambda x: x["sales"],
        )["product"]

    summary = {
        "total_products": (
            int(df["Product"].nunique())
            if "Product" in df.columns
            else 0
        ),
        "total_regions": (
            int(df["Region"].nunique())
            if "Region" in df.columns
            else 0
        ),
        "total_outlets": (
            int(df["Outlet"].nunique())
            if "Outlet" in df.columns
            else 0
        ),
        "total_sales": round(total_sales, 2),
        "top_product": top_product,
    }

    response = {
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

    set_cache(cache_key, response)

    return response


@router.get("/region-analytics")
def region_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    df = load_user_datasets(db, current_user.id)

    if df.empty:
        return []

    if "Region" not in df.columns or "Sales" not in df.columns:
        return []

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    return (
        df.groupby("Region")["Sales"]
        .sum()
        .reset_index()
        .rename(
            columns={
                "Region": "region",
                "Sales": "total_sales",
            }
        )
        .sort_values("total_sales", ascending=False)
        .to_dict(orient="records")
    )


@router.get("/category-insights")
def category_insights(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    df = load_user_datasets(db, current_user.id)

    if df.empty:
        return []

    if "Category" not in df.columns or "Sales" not in df.columns:
        return []

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    return (
        df.groupby("Category")["Sales"]
        .agg(["sum", "mean", "count"])
        .reset_index()
        .rename(
            columns={
                "Category": "category",
                "sum": "total_sales",
                "mean": "average_sales",
                "count": "records",
            }
        )
        .sort_values("total_sales", ascending=False)
        .to_dict(orient="records")
    )


@router.get("/revenue-prediction")
def revenue_prediction(
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
        file_path = os.path.join("uploads", dataset.filename)

        if not os.path.exists(file_path):
            continue

        if dataset.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        all_frames.append(df)

    if not all_frames:
        return {
            "total_revenue": 0,
            "average_revenue": 0,
            "max_revenue": 0,
            "monthly_revenue": [],
        }

    df = pd.concat(all_frames, ignore_index=True)

    if "Sales" not in df.columns:
        return {
            "total_revenue": 0,
            "average_revenue": 0,
            "max_revenue": 0,
            "monthly_revenue": [],
        }

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    total_revenue = round(float(df["Sales"].sum()), 2)
    average_revenue = round(float(df["Sales"].mean()), 2)
    max_revenue = round(float(df["Sales"].max()), 2)

    monthly_revenue = []

    if "Date" in df.columns:
        valid_df = df.copy()

        valid_df["Date"] = pd.to_datetime(
            valid_df["Date"],
            errors="coerce",
        )

        valid_df = valid_df.dropna(subset=["Date"])

        if not valid_df.empty:
            valid_df["month"] = valid_df["Date"].dt.strftime("%Y-%m")

            monthly_data = (
                valid_df.groupby("month")["Sales"]
                .sum()
                .reset_index()
                .sort_values("month")
            )

            monthly_revenue = [
                {
                    "month": row["month"],
                    "revenue": round(float(row["Sales"]), 2),
                }
                for _, row in monthly_data.iterrows()
            ]

    return {
        "total_revenue": total_revenue,
        "average_revenue": average_revenue,
        "max_revenue": max_revenue,
        "monthly_revenue": monthly_revenue,
    }
@router.get("/inventory-risk")
def inventory_risk(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    risks = []

    for forecast in forecasts:
        try:
            value = json.loads(
                forecast.forecast_values or "{}"
            )
        except Exception:
            value = {}

        product = value.get("product", "N/A")
        predicted_sales = value.get("predicted_sales", 0)

        if predicted_sales > 10000:
            risk = "High Stockout Risk"
        elif predicted_sales < 3000:
            risk = "Overstock Risk"
        else:
            risk = "Normal"

        risks.append(
            {
                "product": product,
                "predicted_sales": predicted_sales,
                "risk": risk,
            }
        )

    return risks


@router.get("/anomalies")
def sales_anomalies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    df = load_user_datasets(db, current_user.id)

    if df.empty:
        return []

    return detect_sales_anomalies(df)


@router.get("/seasonal-trends")
def seasonal_trends(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    df = load_user_datasets(db, current_user.id)

    if df.empty:
        return {
            "monthly_trends": [],
            "quarterly_trends": [],
            "message": "No dataset available",
        }

    return detect_seasonal_trends(df)


@router.get("/business-insights")
def business_insights(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    df = load_user_datasets(db, current_user.id)

    if df.empty:
        return {
            "insights": [
                "No dataset available. Upload a dataset to generate insights."
            ]
        }

    return {
        "insights": generate_business_insights(df)
    }