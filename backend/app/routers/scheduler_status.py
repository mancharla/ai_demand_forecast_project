from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ForecastSchedule
from app.utils.dependencies import get_current_admin
from app.services.scheduler_service import scheduler


router = APIRouter(
    prefix="/scheduler",
    tags=["Scheduler"],
)


@router.get("/status")
def scheduler_status(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    total_schedules = db.query(ForecastSchedule).count()

    active_schedules = (
        db.query(ForecastSchedule)
        .filter(ForecastSchedule.is_active == 1)
        .count()
    )

    pending_schedules = (
        db.query(ForecastSchedule)
        .filter(
            ForecastSchedule.is_active == 1,
            ForecastSchedule.next_run_at != None,
        )
        .count()
    )

    return {
        "scheduler_running": scheduler.running,
        "total_schedules": total_schedules,
        "active_schedules": active_schedules,
        "pending_schedules": pending_schedules,
    }