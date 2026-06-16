from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import get_db
from app.utils.dependencies import get_current_user

from app.models_extended import (
    CustomKPI,
    KPIPerformanceHistory,
)

router = APIRouter(
    prefix="/kpi-management",
    tags=["Advanced KPI Management"],
)
class KPICreate(BaseModel):
    organization_id: int | None = None
    project_id: int | None = None

    kpi_name: str
    kpi_type: str

    target_value: float
    current_value: float = 0

    alert_threshold: float = 0
@router.post("/create")
def create_kpi(
    payload: KPICreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpi = CustomKPI(
        organization_id=payload.organization_id,
        project_id=payload.project_id,
        kpi_name=payload.kpi_name,
        kpi_type=payload.kpi_type,
        target_value=payload.target_value,
        current_value=payload.current_value,
        alert_threshold=payload.alert_threshold,
        created_by=current_user.id,
    )

    db.add(kpi)
    db.commit()
    db.refresh(kpi)

    return {
        "message": "KPI created",
        "kpi": kpi,
    }
@router.get("/list")
def get_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(CustomKPI)
        .filter(CustomKPI.created_by == current_user.id)
        .order_by(CustomKPI.created_at.desc())
        .all()
    )
@router.get("/dashboard")
def kpi_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpis = (
        db.query(CustomKPI)
        .filter(
            CustomKPI.organization_id == current_user.organization_id)
        .all()
    )

    alerts = len(
        [
            k
            for k in kpis
            if k.current_value < k.alert_threshold
        ]
    )

    return {
        "total_kpis": len(kpis),
        "alert_count": alerts,
        "healthy_count": len(kpis) - alerts,
    }
@router.get("/{kpi_id}/history")
def kpi_history(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(KPIPerformanceHistory)
        .filter(
            KPIPerformanceHistory.kpi_id == kpi_id
        )
        .order_by(
            KPIPerformanceHistory.created_at.desc()
        )
        .all()
    )
@router.get("/{kpi_id}/trend")
def kpi_trend(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    history = (
        db.query(KPIPerformanceHistory)
        .filter(
            KPIPerformanceHistory.kpi_id == kpi_id
        )
        .order_by(
            KPIPerformanceHistory.created_at.asc()
        )
        .all()
    )

    trend_data = []

    for item in history:
        trend_data.append({
            "date": item.created_at.strftime("%Y-%m-%d"),
            "actual": item.actual_value,
            "forecast": item.forecast_value,
        })

    return trend_data
@router.get("/{kpi_id}/report")
def kpi_report(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    kpi = (
        db.query(CustomKPI)
        .filter(CustomKPI.id == kpi_id)
        .first()
    )

    if not kpi:
        raise HTTPException(
            status_code=404,
            detail="KPI not found",
        )

    history = (
        db.query(KPIPerformanceHistory)
        .filter(
            KPIPerformanceHistory.kpi_id == kpi_id
        )
        .all()
    )

    achievement = 0

    if kpi.target_value > 0:
        achievement = (
            kpi.current_value /
            kpi.target_value
        ) * 100

    return {
        "kpi_name": kpi.kpi_name,
        "target_value": kpi.target_value,
        "current_value": kpi.current_value,
        "achievement_percentage": round(
            achievement,
            2,
        ),
        "history_count": len(history),
    }