from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user

from app.models import Dataset, Forecast, Notification
from app.models_extended import (
    Organization,
    BusinessTarget,
    CustomKPI,
    DataQualityReport,
    ForecastLifecycleStatus,
    ForecastApproval,
    PlanningRecommendation,
)


router = APIRouter(
    prefix="/executive-command-center",
    tags=["Executive Command Center"],
)


@router.get("/summary")
def executive_summary(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    datasets_count = db.query(Dataset).count()
    forecasts_count = db.query(Forecast).count()

    targets_query = db.query(BusinessTarget)
    kpi_query = db.query(CustomKPI)
    quality_query = db.query(DataQualityReport)
    lifecycle_query = db.query(ForecastLifecycleStatus)
    approval_query = db.query(ForecastApproval)
    recommendations_query = db.query(PlanningRecommendation)

    if organization_id:
        targets_query = targets_query.filter(
            BusinessTarget.organization_id == organization_id
        )
        kpi_query = kpi_query.filter(CustomKPI.organization_id == organization_id)
        quality_query = quality_query.filter(
            DataQualityReport.organization_id == organization_id
        )
        lifecycle_query = lifecycle_query.filter(
            ForecastLifecycleStatus.organization_id == organization_id
        )
        approval_query = approval_query.filter(
            ForecastApproval.organization_id == organization_id
        )
        recommendations_query = recommendations_query.filter(
            PlanningRecommendation.organization_id == organization_id
        )

    targets = targets_query.all()
    kpis = kpi_query.all()
    quality_reports = quality_query.all()
    lifecycle_rows = lifecycle_query.all()
    approvals = approval_query.all()
    recommendations = recommendations_query.all()

    avg_quality = (
        round(
            sum(q.quality_score or 0 for q in quality_reports) / len(quality_reports),
            2,
        )
        if quality_reports
        else 0
    )

    kpi_alerts = len(
        [
            k
            for k in kpis
            if (k.current_value or 0) < (k.alert_threshold or 0)
        ]
    )

    pending_approvals = len(
        [
            a
            for a in approvals
            if a.status == "pending"
        ]
    )

    approved_forecasts = len(
        [
            f
            for f in lifecycle_rows
            if f.current_stage == "approved"
        ]
    )

    target_achievement_rate = 0

    if targets:
        total_target = sum(t.target_value or 0 for t in targets)
        total_forecast = sum(t.forecast_value or 0 for t in targets)

        target_achievement_rate = (
            round((total_forecast / total_target) * 100, 2)
            if total_target
            else 0
        )

    executive_health_score = 60

    if avg_quality >= 85:
        executive_health_score += 10

    if kpi_alerts == 0:
        executive_health_score += 10

    if pending_approvals == 0:
        executive_health_score += 10

    if target_achievement_rate >= 80:
        executive_health_score += 10

    executive_health_score = min(executive_health_score, 100)

    return {
        "datasets_count": datasets_count,
        "forecasts_count": forecasts_count,
        "business_targets": len(targets),
        "custom_kpis": len(kpis),
        "average_data_quality": avg_quality,
        "kpi_alerts": kpi_alerts,
        "pending_approvals": pending_approvals,
        "approved_forecasts": approved_forecasts,
        "planning_recommendations": len(recommendations),
        "target_achievement_rate": target_achievement_rate,
        "executive_health_score": executive_health_score,
    }


@router.get("/alerts")
def executive_alerts(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alerts = []

    kpis_query = db.query(CustomKPI)
    quality_query = db.query(DataQualityReport)
    approvals_query = db.query(ForecastApproval)

    if organization_id:
        kpis_query = kpis_query.filter(CustomKPI.organization_id == organization_id)
        quality_query = quality_query.filter(
            DataQualityReport.organization_id == organization_id
        )
        approvals_query = approvals_query.filter(
            ForecastApproval.organization_id == organization_id
        )

    for kpi in kpis_query.all():
        if (kpi.current_value or 0) < (kpi.alert_threshold or 0):
            alerts.append({
                "type": "KPI Alert",
                "severity": "High",
                "message": f"{kpi.kpi_name} is below threshold",
            })

    for report in quality_query.all():
        if (report.quality_score or 0) < 60:
            alerts.append({
                "type": "Data Quality",
                "severity": "Medium",
                "message": f"Dataset #{report.dataset_id} has poor quality score",
            })

    pending_count = approvals_query.filter(
        ForecastApproval.status == "pending"
    ).count()

    if pending_count > 0:
        alerts.append({
            "type": "Approval Pending",
            "severity": "Medium",
            "message": f"{pending_count} forecasts waiting for approval",
        })

    if not alerts:
        alerts.append({
            "type": "System Health",
            "severity": "Low",
            "message": "No critical executive alerts detected",
        })

    return alerts


@router.get("/performance-summary")
def performance_summary(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    targets_query = db.query(BusinessTarget)
    kpis_query = db.query(CustomKPI)

    if organization_id:
        targets_query = targets_query.filter(
            BusinessTarget.organization_id == organization_id
        )
        kpis_query = kpis_query.filter(CustomKPI.organization_id == organization_id)

    targets = targets_query.all()
    kpis = kpis_query.all()

    return {
        "target_status": {
            "achieved": len([t for t in targets if t.status == "achieved"]),
            "on_track": len([t for t in targets if t.status == "on_track"]),
            "at_risk": len([t for t in targets if t.status == "at_risk"]),
            "missed": len([t for t in targets if t.status == "missed"]),
        },
        "kpi_status": {
            "healthy": len(
                [
                    k
                    for k in kpis
                    if (k.current_value or 0) >= (k.alert_threshold or 0)
                ]
            ),
            "alert": len(
                [
                    k
                    for k in kpis
                    if (k.current_value or 0) < (k.alert_threshold or 0)
                ]
            ),
        },
    }