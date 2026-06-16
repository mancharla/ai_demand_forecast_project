from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models import Forecast
from app.models_extended import (
    ForecastGovernanceRecord,
    ForecastLifecycleStatus,
    ForecastApproval,
)


router = APIRouter(
    prefix="/forecast-governance",
    tags=["Forecast Governance"],
)


class GovernanceRecordCreate(BaseModel):
    forecast_id: int
    organization_id: int | None = None
    lifecycle_stage: str = "draft"
    change_type: str = "created"
    change_summary: str | None = None


class LifecycleUpdate(BaseModel):
    current_stage: str
    change_summary: str | None = None


def get_next_version(db: Session, forecast_id: int):
    latest = (
        db.query(ForecastGovernanceRecord)
        .filter(ForecastGovernanceRecord.forecast_id == forecast_id)
        .order_by(ForecastGovernanceRecord.version_number.desc())
        .first()
    )

    return latest.version_number + 1 if latest else 1


@router.post("/records")
def create_governance_record(
    payload: GovernanceRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecast = (
        db.query(Forecast)
        .filter(Forecast.id == payload.forecast_id)
        .first()
    )

    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    version = get_next_version(db, payload.forecast_id)

    record = ForecastGovernanceRecord(
        forecast_id=payload.forecast_id,
        organization_id=payload.organization_id,
        lifecycle_stage=payload.lifecycle_stage,
        version_number=version,
        change_type=payload.change_type,
        change_summary=payload.change_summary,
        changed_by=current_user.id,
    )

    db.add(record)

    lifecycle = (
        db.query(ForecastLifecycleStatus)
        .filter(ForecastLifecycleStatus.forecast_id == payload.forecast_id)
        .first()
    )

    if not lifecycle:
        lifecycle = ForecastLifecycleStatus(
            forecast_id=payload.forecast_id,
            organization_id=payload.organization_id,
            current_stage=payload.lifecycle_stage,
            current_version=version,
            last_action_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
        db.add(lifecycle)
    else:
        lifecycle.current_stage = payload.lifecycle_stage
        lifecycle.current_version = version
        lifecycle.last_action_by = current_user.id
        lifecycle.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(record)

    return {
        "message": "Governance record created",
        "record": record,
    }


@router.put("/lifecycle/{forecast_id}")
def update_lifecycle_status(
    forecast_id: int,
    payload: LifecycleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecast = (
        db.query(Forecast)
        .filter(Forecast.id == forecast_id)
        .first()
    )

    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    version = get_next_version(db, forecast_id)

    lifecycle = (
        db.query(ForecastLifecycleStatus)
        .filter(ForecastLifecycleStatus.forecast_id == forecast_id)
        .first()
    )

    if not lifecycle:
        lifecycle = ForecastLifecycleStatus(
            forecast_id=forecast_id,
            current_stage=payload.current_stage,
            current_version=version,
            last_action_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
        db.add(lifecycle)
    else:
        lifecycle.current_stage = payload.current_stage
        lifecycle.current_version = version
        lifecycle.last_action_by = current_user.id
        lifecycle.updated_at = datetime.utcnow()

    record = ForecastGovernanceRecord(
        forecast_id=forecast_id,
        lifecycle_stage=payload.current_stage,
        version_number=version,
        change_type=payload.current_stage,
        change_summary=payload.change_summary,
        changed_by=current_user.id,
    )

    db.add(record)
    db.commit()

    return {
        "message": "Forecast lifecycle updated",
        "stage": payload.current_stage,
        "version": version,
    }


@router.get("/records/{forecast_id}")
def get_forecast_governance_records(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(ForecastGovernanceRecord)
        .filter(ForecastGovernanceRecord.forecast_id == forecast_id)
        .order_by(ForecastGovernanceRecord.created_at.desc())
        .all()
    )


@router.get("/lifecycle/{forecast_id}")
def get_lifecycle_status(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lifecycle = (
        db.query(ForecastLifecycleStatus)
        .filter(ForecastLifecycleStatus.forecast_id == forecast_id)
        .first()
    )

    if not lifecycle:
        return {
            "forecast_id": forecast_id,
            "current_stage": "draft",
            "current_version": 0,
        }

    return lifecycle


@router.get("/dashboard")
def governance_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lifecycle_rows = db.query(ForecastLifecycleStatus).all()

    draft = len([x for x in lifecycle_rows if x.current_stage == "draft"])
    submitted = len([x for x in lifecycle_rows if x.current_stage == "submitted"])
    approved = len([x for x in lifecycle_rows if x.current_stage == "approved"])
    rejected = len([x for x in lifecycle_rows if x.current_stage == "rejected"])
    archived = len([x for x in lifecycle_rows if x.current_stage == "archived"])

    approvals = db.query(ForecastApproval).all()

    pending_approvals = len([x for x in approvals if x.status == "pending"])

    return {
        "total_forecasts_tracked": len(lifecycle_rows),
        "draft": draft,
        "submitted": submitted,
        "approved": approved,
        "rejected": rejected,
        "archived": archived,
        "pending_approvals": pending_approvals,
    }