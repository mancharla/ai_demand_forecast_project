from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import BusinessKPI, ModelPerformance, AIInsight


router = APIRouter(
    prefix="/business-health",
    tags=["Business Health"],
)


@router.get("/project/{project_id}")
def get_business_health_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpis = (
        db.query(BusinessKPI)
        .filter(BusinessKPI.project_id == project_id)
        .all()
    )

    performances = (
        db.query(ModelPerformance)
        .filter(ModelPerformance.project_id == project_id)
        .all()
    )

    insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .all()
    )

    total_revenue = sum(k.revenue_forecast or 0 for k in kpis)
    total_profit = sum(k.profit_forecast or 0 for k in kpis)

    profit_margin = (
        round((total_profit / total_revenue) * 100, 2)
        if total_revenue
        else 0
    )

    avg_accuracy = (
        round(
            sum(p.accuracy_score or 0 for p in performances)
            / len(performances),
            2,
        )
        if performances
        else 0
    )

    high_risks = [
        item for item in insights
        if item.impact_level == "high"
    ]

    health_score = 60

    if profit_margin > 20:
        health_score += 10

    if avg_accuracy > 85:
        health_score += 15

    if total_revenue > 0:
        health_score += 10

    if len(high_risks) == 0:
        health_score += 5

    health_score = min(health_score, 100)

    risk_level = "Low"

    if len(high_risks) >= 3:
        risk_level = "High"
    elif len(high_risks) >= 1:
        risk_level = "Medium"

    return {
        "health_score": health_score,
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "profit_margin": profit_margin,
        "forecast_accuracy": avg_accuracy,
        "risk_level": risk_level,
        "risk_count": len(high_risks),
    }


@router.get("/kpi-trends/{project_id}")
def get_kpi_trends(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpis = (
        db.query(BusinessKPI)
        .filter(BusinessKPI.project_id == project_id)
        .order_by(BusinessKPI.created_at.asc())
        .all()
    )

    if not kpis:
        return [
            {"month": "Jan", "revenue": 250000, "profit": 65000},
            {"month": "Feb", "revenue": 310000, "profit": 82000},
            {"month": "Mar", "revenue": 390000, "profit": 95000},
            {"month": "Apr", "revenue": 460000, "profit": 125000},
            {"month": "May", "revenue": 520000, "profit": 148000},
        ]

    data = []

    for item in kpis:
        data.append({
            "month": item.created_at.strftime("%b") if item.created_at else "N/A",
            "revenue": item.revenue_forecast or 0,
            "profit": item.profit_forecast or 0,
        })

    return data


@router.get("/risks/{project_id}")
def get_business_risks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .all()
    )

    risks = []

    for item in insights:
        if item.impact_level in ["high", "medium"]:
            risks.append({
                "type": item.insight_type,
                "severity": item.impact_level,
                "description": item.description,
                "recommended_action": item.recommended_action,
            })

    if not risks:
        risks.append({
            "type": "Business Risk",
            "severity": "Low",
            "description": "No major business risk detected.",
            "recommended_action": "Continue monitoring sales and forecast performance.",
        })

    return risks