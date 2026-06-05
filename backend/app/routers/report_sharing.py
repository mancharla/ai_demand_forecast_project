from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import ReportShare, ExecutiveReport
from app.models import Notification


router = APIRouter(
    prefix="/report-sharing",
    tags=["Report Sharing"],
)


class ReportShareCreate(BaseModel):
    report_id: int
    report_type: str = "executive_report"
    recipient_email: EmailStr
    share_message: str | None = None


@router.post("/share")
def share_report(
    payload: ReportShareCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.id == payload.report_id)
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Executive report not found")

    share = ReportShare(
        user_id=current_user.id,
        report_id=payload.report_id,
        report_type=payload.report_type,
        recipient_email=payload.recipient_email,
        share_message=payload.share_message,
        is_active=1,
    )

    db.add(share)

    notification = Notification(
        user_id=current_user.id,
        message=f"Report shared with {payload.recipient_email}",
        type="success",
    )

    db.add(notification)
    db.commit()
    db.refresh(share)

    return {
        "message": "Report shared successfully",
        "share": share,
    }


@router.get("/my-shares")
def get_my_shared_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shares = (
        db.query(ReportShare)
        .filter(ReportShare.user_id == current_user.id)
        .order_by(ReportShare.shared_at.desc())
        .all()
    )

    return shares


@router.get("/report/{report_id}")
def get_report_share_history(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shares = (
        db.query(ReportShare)
        .filter(
            ReportShare.report_id == report_id,
            ReportShare.user_id == current_user.id,
        )
        .order_by(ReportShare.shared_at.desc())
        .all()
    )

    return shares


@router.delete("/{share_id}")
def delete_report_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    share = (
        db.query(ReportShare)
        .filter(
            ReportShare.id == share_id,
            ReportShare.user_id == current_user.id,
        )
        .first()
    )

    if not share:
        raise HTTPException(status_code=404, detail="Share record not found")

    db.delete(share)
    db.commit()

    return {
        "message": "Share record deleted successfully",
    }