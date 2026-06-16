from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import BusinessTarget, PlanningRecommendation


router = APIRouter(
    prefix="/strategic-planning",
    tags=["Strategic Planning"],
)


class BusinessTargetCreate(BaseModel):
    organization_id: int | None = None
    project_id: int | None = None
    target_name: str
    target_type: str
    target_period: str
    target_value: float
    actual_value: float = 0
    forecast_value: float = 0


class BusinessTargetUpdate(BaseModel):
    target_name: str | None = None
    target_type: str | None = None
    target_period: str | None = None
    target_value: float | None = None
    actual_value: float | None = None
    forecast_value: float | None = None
    status: str | None = None


def calculate_target_status(target_value, actual_value, forecast_value):
    comparison_value = forecast_value or actual_value

    if target_value <= 0:
        return "on_track"

    achievement = (comparison_value / target_value) * 100

    if achievement >= 100:
        return "achieved"

    if achievement >= 80:
        return "on_track"

    if achievement >= 60:
        return "at_risk"

    return "missed"


def generate_planning_recommendation(target):
    gap = target.target_value - (target.forecast_value or target.actual_value or 0)

    if gap <= 0:
        return {
            "type": "growth",
            "title": f"{target.target_name} is on track",
            "description": "Forecasted performance meets or exceeds the business target.",
            "priority": "low",
        }

    return {
        "type": "improvement",
        "title": f"{target.target_name} requires attention",
        "description": (
            f"There is a gap of {gap:.2f} between target and forecast/actual value. "
            "Review pricing, sales campaigns, demand planning and inventory strategy."
        ),
        "priority": "high" if gap > target.target_value * 0.3 else "medium",
    }


@router.post("/targets")
def create_business_target(
    payload: BusinessTargetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    status = calculate_target_status(
        payload.target_value,
        payload.actual_value,
        payload.forecast_value,
    )

    target = BusinessTarget(
        organization_id=payload.organization_id,
        project_id=payload.project_id,
        target_name=payload.target_name,
        target_type=payload.target_type,
        target_period=payload.target_period,
        target_value=payload.target_value,
        actual_value=payload.actual_value,
        forecast_value=payload.forecast_value,
        status=status,
        created_by=current_user.id,
    )

    db.add(target)
    db.commit()
    db.refresh(target)

    rec_data = generate_planning_recommendation(target)

    recommendation = PlanningRecommendation(
        organization_id=payload.organization_id,
        project_id=payload.project_id,
        recommendation_type=rec_data["type"],
        title=rec_data["title"],
        description=rec_data["description"],
        priority=rec_data["priority"],
    )

    db.add(recommendation)
    db.commit()

    return {
        "message": "Business target created",
        "target": target,
    }


@router.get("/targets")
def get_my_targets(
    project_id: int | None = None,
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(BusinessTarget).filter(
        BusinessTarget.created_by == current_user.id
    )

    if project_id:
        query = query.filter(BusinessTarget.project_id == project_id)

    if organization_id:
        query = query.filter(BusinessTarget.organization_id == organization_id)

    return query.order_by(BusinessTarget.created_at.desc()).all()


@router.put("/targets/{target_id}")
def update_business_target(
    target_id: int,
    payload: BusinessTargetUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    target = (
        db.query(BusinessTarget)
        .filter(
            BusinessTarget.id == target_id,
            BusinessTarget.created_by == current_user.id,
        )
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(target, key, value)

    target.status = calculate_target_status(
        target.target_value,
        target.actual_value,
        target.forecast_value,
    )

    db.commit()
    db.refresh(target)

    return {
        "message": "Business target updated",
        "target": target,
    }


@router.delete("/targets/{target_id}")
def delete_business_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    target = (
        db.query(BusinessTarget)
        .filter(
            BusinessTarget.id == target_id,
            BusinessTarget.created_by == current_user.id,
        )
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    db.delete(target)
    db.commit()

    return {"message": "Target deleted"}


@router.get("/recommendations")
def get_planning_recommendations(
    project_id: int | None = None,
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(PlanningRecommendation)

    if project_id:
        query = query.filter(PlanningRecommendation.project_id == project_id)

    if organization_id:
        query = query.filter(
            PlanningRecommendation.organization_id == organization_id
        )

    return query.order_by(PlanningRecommendation.created_at.desc()).all()


@router.get("/dashboard")
def get_planning_dashboard(
    project_id: int | None = None,
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(BusinessTarget).filter(
        BusinessTarget.created_by == current_user.id
    )

    if project_id:
        query = query.filter(BusinessTarget.project_id == project_id)

    if organization_id:
        query = query.filter(BusinessTarget.organization_id == organization_id)

    targets = query.all()

    total_targets = len(targets)
    achieved = len([t for t in targets if t.status == "achieved"])
    at_risk = len([t for t in targets if t.status == "at_risk"])
    missed = len([t for t in targets if t.status == "missed"])
    on_track = len([t for t in targets if t.status == "on_track"])

    total_target_value = sum(t.target_value or 0 for t in targets)
    total_forecast_value = sum(t.forecast_value or 0 for t in targets)

    achievement_rate = (
        round((total_forecast_value / total_target_value) * 100, 2)
        if total_target_value
        else 0
    )

    return {
        "total_targets": total_targets,
        "achieved": achieved,
        "on_track": on_track,
        "at_risk": at_risk,
        "missed": missed,
        "total_target_value": total_target_value,
        "total_forecast_value": total_forecast_value,
        "achievement_rate": achievement_rate,
    }