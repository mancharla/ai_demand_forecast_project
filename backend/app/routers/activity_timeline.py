from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user

from app.models_extended import (
    ProjectActivity,
    ForecastProject,
    AIInsight,
    ExecutiveReport,
    ForecastScenario,
)

from app.models import Dataset, Forecast


router = APIRouter(
    prefix="/activity-timeline",
    tags=["Activity Timeline"],
)


@router.get("/project/{project_id}")
def get_project_timeline(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    timeline = []

    activities = (
        db.query(ProjectActivity)
        .filter(ProjectActivity.project_id == project_id)
        .order_by(ProjectActivity.created_at.desc())
        .all()
    )

    for item in activities:
        timeline.append({
            "id": f"activity-{item.id}",
            "type": "activity",
            "title": item.action,
            "description": item.description,
            "created_at": item.created_at,
        })

    insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .order_by(AIInsight.created_at.desc())
        .all()
    )

    for item in insights:
        timeline.append({
            "id": f"insight-{item.id}",
            "type": "ai_insight",
            "title": item.title,
            "description": item.description,
            "created_at": item.created_at,
        })

    reports = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.project_id == project_id)
        .order_by(ExecutiveReport.created_at.desc())
        .all()
    )

    for item in reports:
        timeline.append({
            "id": f"report-{item.id}",
            "type": "report",
            "title": item.title,
            "description": item.summary,
            "created_at": item.created_at,
        })

    scenarios = (
        db.query(ForecastScenario)
        .filter(ForecastScenario.project_id == project_id)
        .order_by(ForecastScenario.created_at.desc())
        .all()
    )

    for item in scenarios:
        timeline.append({
            "id": f"scenario-{item.id}",
            "type": "scenario",
            "title": item.name,
            "description": item.description,
            "created_at": item.created_at,
        })

    timeline.sort(
        key=lambda x: x["created_at"] or "",
        reverse=True,
    )

    return timeline


@router.get("/my-activities")
def get_my_activities(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    activities = (
        db.query(ProjectActivity)
        .filter(ProjectActivity.user_id == current_user.id)
        .order_by(ProjectActivity.created_at.desc())
        .limit(100)
        .all()
    )

    return activities


@router.get("/project-summary/{project_id}")
def get_project_activity_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(ForecastProject)
        .filter(ForecastProject.id == project_id)
        .first()
    )

    datasets_count = 0
    forecasts_count = 0

    if project:
        datasets_count = getattr(project, "total_datasets", 0) or 0
        forecasts_count = getattr(project, "total_forecasts", 0) or 0

    scenarios_count = (
        db.query(ForecastScenario)
        .filter(ForecastScenario.project_id == project_id)
        .count()
    )

    insights_count = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .count()
    )

    reports_count = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.project_id == project_id)
        .count()
    )

    activities_count = (
        db.query(ProjectActivity)
        .filter(ProjectActivity.project_id == project_id)
        .count()
    )

    return {
        "datasets_uploaded": datasets_count,
        "forecasts_generated": forecasts_count,
        "scenarios_created": scenarios_count,
        "ai_insights_generated": insights_count,
        "reports_generated": reports_count,
        "activities_tracked": activities_count,
    }