from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models_extended import ForecastProject, ProjectMember
from app.utils.dependencies import get_current_user
from app.services.executive_analytics import ExecutiveAnalyticsService
from app.models import User

router = APIRouter(
    prefix="/executive-dashboard",
    tags=["Executive Dashboard"],
)


def _verify_project_access(
    project_id: int,
    db: Session,
    current_user: User,
) -> ForecastProject:
    project = db.query(ForecastProject).filter(
        ForecastProject.id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id,
    ).first()

    if project.owner_id != current_user.id and not member and not project.is_public:
        raise HTTPException(status_code=403, detail="Access denied")

    return project


@router.get("/{project_id}")
def executive_overview(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _verify_project_access(project_id, db, current_user)
    return ExecutiveAnalyticsService.get_executive_overview(project, db)


@router.get("/{project_id}/revenue-forecast")
def revenue_forecast(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _verify_project_access(project_id, db, current_user)
    return ExecutiveAnalyticsService.calculate_revenue_forecast(project, db)


@router.get("/{project_id}/profit-analysis")
def profit_analysis(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _verify_project_access(project_id, db, current_user)
    return ExecutiveAnalyticsService.calculate_profit_analysis(project, db)


@router.get("/{project_id}/cost-analysis")
def cost_analysis(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _verify_project_access(project_id, db, current_user)
    return ExecutiveAnalyticsService.calculate_cost_analysis(project, db)


@router.get("/{project_id}/kpi-summary")
def kpi_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _verify_project_access(project_id, db, current_user)
    return ExecutiveAnalyticsService.calculate_kpi_summary(project, db)
