from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models import Forecast, Notification
from app.models_extended import (
    ForecastApproval,
    ForecastApprovalHistory,
)


router = APIRouter(
    prefix="/forecast-approvals",
    tags=["Forecast Approvals"],
)


class SubmitApprovalRequest(BaseModel):
    forecast_id: int
    organization_id: int | None = None
    comments: str | None = None


class ReviewApprovalRequest(BaseModel):
    status: str
    remarks: str | None = None


@router.post("/submit")
def submit_forecast_for_approval(
    payload: SubmitApprovalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecast = (
        db.query(Forecast)
        .filter(
            Forecast.id == payload.forecast_id,
            Forecast.user_id == current_user.id,
        )
        .first()
    )

    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    existing = (
        db.query(ForecastApproval)
        .filter(
            ForecastApproval.forecast_id == payload.forecast_id,
            ForecastApproval.status == "pending",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Forecast already submitted and pending approval",
        )

    approval = ForecastApproval(
        forecast_id=payload.forecast_id,
        organization_id=payload.organization_id,
        submitted_by=current_user.id,
        status="pending",
        comments=payload.comments,
    )

    db.add(approval)
    db.commit()
    db.refresh(approval)

    history = ForecastApprovalHistory(
        approval_id=approval.id,
        action_by=current_user.id,
        action="submitted",
        remarks=payload.comments,
    )

    db.add(history)

    notification = Notification(
        user_id=current_user.id,
        message=f"Forecast #{payload.forecast_id} submitted for approval",
        type="info",
    )

    db.add(notification)
    db.commit()

    return {
        "message": "Forecast submitted for approval",
        "approval": approval,
    }


@router.get("/my-submissions")
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    approvals = (
        db.query(ForecastApproval)
        .filter(ForecastApproval.submitted_by == current_user.id)
        .order_by(ForecastApproval.submitted_at.desc())
        .all()
    )

    return approvals


@router.get("/pending")
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    approvals = (
        db.query(ForecastApproval)
        .filter(ForecastApproval.status == "pending")
        .order_by(ForecastApproval.submitted_at.desc())
        .all()
    )

    return approvals


@router.put("/{approval_id}/review")
def review_forecast_approval(
    approval_id: int,
    payload: ReviewApprovalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if payload.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected",
        )

    approval = (
        db.query(ForecastApproval)
        .filter(ForecastApproval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = payload.status
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.utcnow()

    history = ForecastApprovalHistory(
        approval_id=approval.id,
        action_by=current_user.id,
        action=payload.status,
        remarks=payload.remarks,
    )

    db.add(history)

    notification = Notification(
        user_id=approval.submitted_by,
        message=f"Forecast #{approval.forecast_id} was {payload.status}",
        type="success" if payload.status == "approved" else "warning",
    )

    db.add(notification)
    db.commit()
    db.refresh(approval)

    return {
        "message": f"Forecast {payload.status}",
        "approval": approval,
    }


@router.get("/{approval_id}/history")
def get_approval_history(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    history = (
        db.query(ForecastApprovalHistory)
        .filter(ForecastApprovalHistory.approval_id == approval_id)
        .order_by(ForecastApprovalHistory.created_at.desc())
        .all()
    )

    return history