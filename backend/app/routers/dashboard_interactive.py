from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user

from app.models import Dataset, Forecast
from app.models_extended import (
    ForecastProject,
    BusinessKPI,
)
router = APIRouter(
    prefix="/dashboard-interactive",
    tags=["Interactive Dashboard"],
)
@router.get("/filters/{project_id}")
def get_filter_options(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    regions = [
        "North",
        "South",
        "East",
        "West",
    ]

    categories = [
        "Electronics",
        "Fashion",
        "Home",
        "Grocery",
    ]

    return {
        "regions": regions,
        "categories": categories,
    }
@router.get("/summary/{project_id}")
def get_summary(
    project_id: int,
    region: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpis = (
        db.query(BusinessKPI)
        .filter(BusinessKPI.project_id == project_id)
        .all()
    )

    total_revenue = sum(
        k.revenue_forecast or 0
        for k in kpis
    )

    total_profit = sum(
        k.profit_forecast or 0
        for k in kpis
    )

    total_cost = sum(
        k.cost_forecast or 0
        for k in kpis
    )

    return {
        "revenue": total_revenue,
        "profit": total_profit,
        "cost": total_cost,
        "growth_rate": (
            round(
                (total_profit / total_revenue) * 100,
                2,
            )
            if total_revenue
            else 0
        ),
        "selected_region": region,
        "selected_category": category,
    }
@router.get("/drilldown/{project_id}")
def get_drilldown_data(
    project_id: int,
    region: str | None = None,
    category: str | None = None,
    product: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sample_rows = [
        {
            "product": "Laptop",
            "region": "South",
            "category": "Electronics",
            "forecast_sales": 15400,
            "revenue": 920000,
        },
        {
            "product": "Mobile",
            "region": "South",
            "category": "Electronics",
            "forecast_sales": 9800,
            "revenue": 670000,
        },
        {
            "product": "Headphones",
            "region": "North",
            "category": "Electronics",
            "forecast_sales": 5400,
            "revenue": 180000,
        },
    ]

    results = sample_rows

    if region:
        results = [
            r
            for r in results
            if r["region"] == region
        ]

    if category:
        results = [
            r
            for r in results
            if r["category"] == category
        ]

    if product:
        results = [
            r
            for r in results
            if r["product"] == product
        ]

    return results
@router.get("/charts/{project_id}")
def get_chart_data(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return {
        "region_sales": [
            {"name": "North", "value": 320000},
            {"name": "South", "value": 450000},
            {"name": "East", "value": 280000},
            {"name": "West", "value": 390000},
        ],
        "category_sales": [
            {"name": "Electronics", "value": 520000},
            {"name": "Fashion", "value": 280000},
            {"name": "Home", "value": 190000},
            {"name": "Grocery", "value": 120000},
        ],
    }