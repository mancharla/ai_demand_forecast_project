import os
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/drilldown",
    tags=["Drill Down Analytics"],
)


def load_dataset(dataset):
    file_path = os.path.join("uploads", dataset.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    if dataset.filename.endswith(".csv"):
        return pd.read_csv(file_path)

    return pd.read_excel(file_path)


def get_user_dataset(dataset_id, db, current_user):
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

    return dataset


@router.get("/region/{dataset_id}/{region}")
def region_drilldown(
    dataset_id: int,
    region: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = get_user_dataset(
        dataset_id,
        db,
        current_user,
    )

    df = load_dataset(dataset)

    if "Region" not in df.columns or "Sales" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Dataset must contain Region and Sales columns",
        )

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    region_df = df[
        df["Region"].astype(str).str.lower()
        == region.lower()
    ]

    if region_df.empty:
        return {
            "region": region,
            "total_sales": 0,
            "products": [],
            "categories": [],
            "monthly_sales": [],
        }

    products = []

    if "Product" in region_df.columns:
        product_sales = (
            region_df.groupby("Product")["Sales"]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
        )

        products = [
            {
                "product": row["Product"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in product_sales.iterrows()
        ]

    categories = []

    if "Category" in region_df.columns:
        category_sales = (
            region_df.groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
        )

        categories = [
            {
                "category": row["Category"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in category_sales.iterrows()
        ]

    monthly_sales = []

    if "Date" in region_df.columns:
        temp_df = region_df.copy()

        temp_df["Date"] = pd.to_datetime(
            temp_df["Date"],
            errors="coerce",
        )

        temp_df = temp_df.dropna(subset=["Date"])

        if not temp_df.empty:
            temp_df["month"] = temp_df["Date"].dt.strftime("%Y-%m")

            monthly = (
                temp_df.groupby("month")["Sales"]
                .sum()
                .reset_index()
                .sort_values("month")
            )

            monthly_sales = [
                {
                    "month": row["month"],
                    "sales": round(float(row["Sales"]), 2),
                }
                for _, row in monthly.iterrows()
            ]

    return {
        "region": region,
        "total_sales": round(float(region_df["Sales"].sum()), 2),
        "products": products,
        "categories": categories,
        "monthly_sales": monthly_sales,
    }


@router.get("/product/{dataset_id}/{product}")
def product_drilldown(
    dataset_id: int,
    product: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = get_user_dataset(
        dataset_id,
        db,
        current_user,
    )

    df = load_dataset(dataset)

    if "Product" not in df.columns or "Sales" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Dataset must contain Product and Sales columns",
        )

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    product_df = df[
        df["Product"].astype(str).str.lower()
        == product.lower()
    ]

    if product_df.empty:
        return {
            "product": product,
            "total_sales": 0,
            "regions": [],
            "categories": [],
            "monthly_sales": [],
        }

    regions = []

    if "Region" in product_df.columns:
        region_sales = (
            product_df.groupby("Region")["Sales"]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
        )

        regions = [
            {
                "region": row["Region"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in region_sales.iterrows()
        ]

    categories = []

    if "Category" in product_df.columns:
        category_sales = (
            product_df.groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
        )

        categories = [
            {
                "category": row["Category"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in category_sales.iterrows()
        ]

    monthly_sales = []

    if "Date" in product_df.columns:
        temp_df = product_df.copy()

        temp_df["Date"] = pd.to_datetime(
            temp_df["Date"],
            errors="coerce",
        )

        temp_df = temp_df.dropna(subset=["Date"])

        if not temp_df.empty:
            temp_df["month"] = temp_df["Date"].dt.strftime("%Y-%m")

            monthly = (
                temp_df.groupby("month")["Sales"]
                .sum()
                .reset_index()
                .sort_values("month")
            )

            monthly_sales = [
                {
                    "month": row["month"],
                    "sales": round(float(row["Sales"]), 2),
                }
                for _, row in monthly.iterrows()
            ]

    return {
        "product": product,
        "total_sales": round(float(product_df["Sales"].sum()), 2),
        "regions": regions,
        "categories": categories,
        "monthly_sales": monthly_sales,
    }