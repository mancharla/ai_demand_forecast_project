from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ForecastSchedule, Dataset
from app.utils.dependencies import get_current_user
from app.services.scheduler_service import calculate_next_run


router = APIRouter(
    prefix="/forecast-schedules",
    tags=["Forecast Schedules"],
)


class ScheduleCreate(BaseModel):
    dataset_id: int
    schedule_name: str
    forecast_days: int = 30
    interval_type: str = "daily"
    model_type: str = "best"


class ScheduleUpdate(BaseModel):
    schedule_name: str | None = None
    forecast_days: int | None = None
    interval_type: str | None = None
    model_type: str | None = None
    is_active: int | None = None


@router.post("/create")
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
    db.query(Dataset)
    .filter(Dataset.id == payload.dataset_id)
    .first()
)

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    schedule = ForecastSchedule(
        user_id=current_user.id,
        dataset_id=payload.dataset_id,
        schedule_name=payload.schedule_name,
        forecast_days=payload.forecast_days,
        interval_type=payload.interval_type,
        model_type=payload.model_type,
        is_active=1,
        next_run_at=calculate_next_run(payload.interval_type),
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "message": "Forecast schedule created successfully",
        "schedule": schedule,
    }


@router.get("/my-schedules")
def get_my_schedules(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    schedules = (
        db.query(ForecastSchedule)
        .filter(ForecastSchedule.user_id == current_user.id)
        .order_by(ForecastSchedule.created_at.desc())
        .all()
    )

    return schedules


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    schedule = (
        db.query(ForecastSchedule)
        .filter(
            ForecastSchedule.id == schedule_id,
            ForecastSchedule.user_id == current_user.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found",
        )

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(schedule, key, value)

    if "interval_type" in data:
        schedule.next_run_at = calculate_next_run(schedule.interval_type)

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Forecast schedule updated successfully",
        "schedule": schedule,
    }


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    schedule = (
        db.query(ForecastSchedule)
        .filter(
            ForecastSchedule.id == schedule_id,
            ForecastSchedule.user_id == current_user.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found",
        )

    db.delete(schedule)
    db.commit()

    return {
        "message": "Forecast schedule deleted successfully",
    }


@router.post("/run/{schedule_id}")
def run_schedule_manually(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    schedule = (
        db.query(ForecastSchedule)
        .filter(
            ForecastSchedule.id == schedule_id,
            ForecastSchedule.user_id == current_user.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found",
        )

    schedule.last_run_at = datetime.utcnow()
    schedule.next_run_at = calculate_next_run(schedule.interval_type)

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Schedule marked as executed manually",
        "schedule": schedule,
    }