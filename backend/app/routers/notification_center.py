from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models import Notification
from app.models_extended import (
    NotificationPreference,
    OrganizationAnnouncement,
)


router = APIRouter(
    prefix="/notification-center",
    tags=["Notification Center"],
)


class PreferenceUpdate(BaseModel):
    organization_id: int | None = None
    email_enabled: int = 0
    in_app_enabled: int = 1
    forecast_alerts: int = 1
    approval_alerts: int = 1
    report_alerts: int = 1
    workflow_alerts: int = 1


class AnnouncementCreate(BaseModel):
    organization_id: int | None = None
    title: str
    message: str
    role_target: str = "all"


@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = 1
    db.commit()

    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .all()
    )

    for item in notifications:
        item.is_read = 1

    db.commit()

    return {"message": "All notifications marked as read"}


@router.get("/preferences")
def get_preferences(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    preference = (
        db.query(NotificationPreference)
        .filter(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.organization_id == organization_id,
        )
        .first()
    )

    if not preference:
        preference = NotificationPreference(
            user_id=current_user.id,
            organization_id=organization_id,
        )
        db.add(preference)
        db.commit()
        db.refresh(preference)

    return preference


@router.put("/preferences")
def update_preferences(
    payload: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    preference = (
        db.query(NotificationPreference)
        .filter(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.organization_id == payload.organization_id,
        )
        .first()
    )

    if not preference:
        preference = NotificationPreference(
            user_id=current_user.id,
            organization_id=payload.organization_id,
        )
        db.add(preference)

    preference.email_enabled = payload.email_enabled
    preference.in_app_enabled = payload.in_app_enabled
    preference.forecast_alerts = payload.forecast_alerts
    preference.approval_alerts = payload.approval_alerts
    preference.report_alerts = payload.report_alerts
    preference.workflow_alerts = payload.workflow_alerts
    preference.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(preference)

    return {
        "message": "Notification preferences updated",
        "preferences": preference,
    }


@router.post("/announcements")
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    announcement = OrganizationAnnouncement(
        organization_id=payload.organization_id,
        title=payload.title,
        message=payload.message,
        role_target=payload.role_target,
        created_by=current_user.id,
        is_active=1,
    )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return {
        "message": "Announcement created",
        "announcement": announcement,
    }


@router.get("/announcements")
def get_announcements(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(OrganizationAnnouncement).filter(
        OrganizationAnnouncement.is_active == 1
    )

    if organization_id:
        query = query.filter(
            OrganizationAnnouncement.organization_id == organization_id
        )

    return query.order_by(OrganizationAnnouncement.created_at.desc()).all()