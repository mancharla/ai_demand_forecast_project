import os
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.utils.security import verify_token


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
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


def empty_dashboard_response():
    return {
        "summary": {
            "total_products": 0,
            "total_regions": 0,
            "total_sales": 0,
            "top_product": "N/A"
        },
        "product_sales": [],
        "region_sales": [],
        "monthly_sales": [],
        "category_sales": [],
        "forecast_vs_actual": [],
        "filters": {
            "categories": [],
            "regions": []
        },
        "recent_activity": []
    }


@router.get("/forecast-analysis")
def dashboard_forecast_analysis(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    category: str | None = Query(None),
    region: str | None = Query(None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    datasets = db.query(Dataset).filter(
        Dataset.user_id == user.id
    ).all()

    all_data = []

    for dataset in datasets:

        if not os.path.exists(dataset.file_path):
            continue

        try:
            if dataset.file_path.endswith(".csv"):
                df = pd.read_csv(dataset.file_path)
            else:
                df = pd.read_excel(dataset.file_path)

            # Clean column names
            df.columns = (
                df.columns.astype(str)
                .str.strip()
                .str.replace("\ufeff", "", regex=False)
            )

            # Sales column is mandatory
            if "Sales" not in df.columns:
                continue

            # Convert data types
            df["Sales"] = pd.to_numeric(
                df["Sales"],
                errors="coerce"
            )

            # Optional columns
            if "Date" in df.columns:
                df["Date"] = pd.to_datetime(
                    df["Date"],
                    errors="coerce"
                )

            if "Product" not in df.columns:
                df["Product"] = "Unknown Product"

            if "Region" not in df.columns:
                df["Region"] = "Unknown"

            if "Category" not in df.columns:
                df["Category"] = "Uncategorized"

            # Remove invalid sales
            df = df.dropna(subset=["Sales"])

            if not df.empty:
                all_data.append(df)

        except Exception as e:
            print("Dashboard dataset read error:", e)

    if not all_data:
        return empty_dashboard_response()

    # Combine all datasets
    df = pd.concat(all_data, ignore_index=True)

    # Apply filters
    if start_date and "Date" in df.columns:
        df = df[
            df["Date"] >= pd.to_datetime(start_date)
        ]

    if end_date and "Date" in df.columns:
        df = df[
            df["Date"] <= pd.to_datetime(end_date)
        ]

    if category:
        df = df[
            df["Category"] == category
        ]

    if region:
        df = df[
            df["Region"] == region
        ]

    if df.empty:
        return empty_dashboard_response()

    # Summary calculations
    total_sales = round(
        float(df["Sales"].sum()),
        2
    )

    total_products = int(
        df["Product"].nunique()
    )

    total_regions = int(
        df["Region"].nunique()
    )

    top_product = (
        df.groupby("Product")["Sales"]
        .sum()
        .idxmax()
    )

    # Product sales
    product_sales_df = (
        df.groupby("Product")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .head(10)
        .reset_index()
    )

    product_sales = [
        {
            "product": str(row["Product"]),
            "sales": round(float(row["Sales"]), 2)
        }
        for _, row in product_sales_df.iterrows()
    ]

    # Region sales
    region_sales_df = (
        df.groupby("Region")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .reset_index()
    )

    region_sales = [
        {
            "region": str(row["Region"]),
            "sales": round(float(row["Sales"]), 2)
        }
        for _, row in region_sales_df.iterrows()
    ]

    # Category sales
    category_sales_df = (
        df.groupby("Category")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .reset_index()
    )

    category_sales = [
        {
            "category": str(row["Category"]),
            "sales": round(float(row["Sales"]), 2)
        }
        for _, row in category_sales_df.iterrows()
    ]

    # Monthly sales trend
    monthly_sales = []

    if "Date" in df.columns:
        valid_dates = df.dropna(subset=["Date"]).copy()

        if not valid_dates.empty:
            valid_dates["Month"] = (
                valid_dates["Date"]
                .dt.strftime("%Y-%m")
            )

            monthly_sales_df = (
                valid_dates
                .groupby("Month")["Sales"]
                .sum()
                .reset_index()
                .sort_values("Month")
            )

            monthly_sales = [
                {
                    "month": str(row["Month"]),
                    "sales": round(float(row["Sales"]), 2)
                }
                for _, row in monthly_sales_df.iterrows()
            ]

    # Recent forecast activity
    recent_forecasts = (
        db.query(Forecast)
        .join(
            Dataset,
            Forecast.dataset_id == Dataset.id
        )
        .filter(
            Dataset.user_id == user.id
        )
        .order_by(Forecast.id.desc())
        .limit(10)
        .all()
    )

    recent_activity = [
        {
            "id": forecast.id,
            "product_name": forecast.product_name,
            "predicted_sales": float(
                forecast.predicted_sales
            ),
            "dataset_id": forecast.dataset_id
        }
        for forecast in recent_forecasts
    ]

    # Forecast vs Actual
    forecast_vs_actual = []

    for forecast in recent_forecasts:
        product = forecast.product_name

        product_rows = df[
            df["Product"] == product
        ]

        if not product_rows.empty:
            actual = round(
                float(
                    product_rows["Sales"].mean()
                ),
                2
            )
        else:
            actual = 0

        forecast_vs_actual.append(
            {
                "product": product,
                "actual": actual,
                "forecast": round(
                    float(
                        forecast.predicted_sales
                    ),
                    2
                )
            }
        )

    # Available filter values
    categories = sorted(
        df["Category"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    regions = sorted(
        df["Region"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    return {
        "summary": {
            "total_products": total_products,
            "total_regions": total_regions,
            "total_sales": total_sales,
            "top_product": str(top_product)
        },

        "product_sales": product_sales,

        "region_sales": region_sales,

        "category_sales": category_sales,

        "monthly_sales": monthly_sales,

        "forecast_vs_actual": forecast_vs_actual,

        "filters": {
            "categories": categories,
            "regions": regions
        },

        "recent_activity": recent_activity
    }