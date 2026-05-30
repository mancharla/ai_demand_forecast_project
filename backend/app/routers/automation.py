from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Dataset,
    ForecastSchedule,
    Notification,
)
from app.schemas import (
    ForecastScheduleCreate,
    ForecastScheduleUpdate,
)
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/automation",
    tags=["Smart Automation"],
)


def calculate_next_run(interval_type: str):
    now = datetime.utcnow()

    if interval_type == "daily":
        return now + timedelta(days=1)

    if interval_type == "weekly":
        return now + timedelta(weeks=1)

    if interval_type == "monthly":
        return now + timedelta(days=30)

    return now + timedelta(days=1)


@router.post("/forecast-schedules")
def create_forecast_schedule(
    payload: ForecastScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == payload.dataset_id,
            Dataset.user_id == current_user.id,
        )
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
        next_run_at=calculate_next_run(payload.interval_type),
    )

    db.add(schedule)

    notification = Notification(
        user_id=current_user.id,
        message="Forecast schedule created successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="FORECAST_SCHEDULE_CREATED",
        description=f"Created schedule {payload.schedule_name}",
        module="Automation",
    )

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Forecast schedule created successfully",
        "schedule": schedule,
    }


@router.get("/forecast-schedules")
def get_forecast_schedules(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    schedules = (
        db.query(ForecastSchedule)
        .filter(ForecastSchedule.user_id == current_user.id)
        .order_by(ForecastSchedule.id.desc())
        .all()
    )

    return schedules


@router.put("/forecast-schedules/{schedule_id}")
def update_forecast_schedule(
    schedule_id: int,
    payload: ForecastScheduleUpdate,
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

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(schedule, key, value)

    if "interval_type" in update_data:
        schedule.next_run_at = calculate_next_run(schedule.interval_type)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="FORECAST_SCHEDULE_UPDATED",
        description=f"Updated schedule {schedule.id}",
        module="Automation",
    )

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Forecast schedule updated successfully",
        "schedule": schedule,
    }


@router.delete("/forecast-schedules/{schedule_id}")
def delete_forecast_schedule(
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

    log_activity(
        db=db,
        user_id=current_user.id,
        action="FORECAST_SCHEDULE_DELETED",
        description=f"Deleted schedule {schedule_id}",
        module="Automation",
    )

    db.commit()

    return {
        "message": "Forecast schedule deleted successfully",
    }


@router.post("/forecast-schedules/{schedule_id}/run-now")
def run_schedule_now(
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

    notification = Notification(
        user_id=current_user.id,
        message="Scheduled forecast triggered successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="FORECAST_SCHEDULE_RUN_NOW",
        description=f"Manually triggered schedule {schedule.id}",
        module="Automation",
    )

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Schedule triggered successfully",
        "schedule": schedule,
    }