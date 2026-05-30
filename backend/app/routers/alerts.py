from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AlertSetting, Notification
from app.schemas import AlertSettingCreate, AlertSettingUpdate
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity
from app.services.email_service import send_email_notification


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


@router.post("/settings")
def create_alert_setting(
    payload: AlertSettingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = AlertSetting(
        user_id=current_user.id,
        alert_name=payload.alert_name,
        alert_type=payload.alert_type,
        threshold_value=payload.threshold_value,
        email_enabled=payload.email_enabled,
        in_app_enabled=payload.in_app_enabled,
    )

    db.add(alert)

    notification = Notification(
        user_id=current_user.id,
        message="Alert setting created successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="ALERT_SETTING_CREATED",
        description=f"Created alert setting {payload.alert_name}",
        module="Alerts",
    )

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert setting created successfully",
        "alert": alert,
    }


@router.get("/settings")
def get_alert_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alerts = (
        db.query(AlertSetting)
        .filter(AlertSetting.user_id == current_user.id)
        .order_by(AlertSetting.id.desc())
        .all()
    )

    return alerts


@router.put("/settings/{alert_id}")
def update_alert_setting(
    alert_id: int,
    payload: AlertSettingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = (
        db.query(AlertSetting)
        .filter(
            AlertSetting.id == alert_id,
            AlertSetting.user_id == current_user.id,
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert setting not found",
        )

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(alert, key, value)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="ALERT_SETTING_UPDATED",
        description=f"Updated alert setting {alert.id}",
        module="Alerts",
    )

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert setting updated successfully",
        "alert": alert,
    }


@router.delete("/settings/{alert_id}")
def delete_alert_setting(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = (
        db.query(AlertSetting)
        .filter(
            AlertSetting.id == alert_id,
            AlertSetting.user_id == current_user.id,
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert setting not found",
        )

    db.delete(alert)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="ALERT_SETTING_DELETED",
        description=f"Deleted alert setting {alert_id}",
        module="Alerts",
    )

    db.commit()

    return {
        "message": "Alert setting deleted successfully",
    }


@router.post("/generate-test")
def generate_test_alert(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification = Notification(
        user_id=current_user.id,
        message="Test alert generated successfully",
        type="warning",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="TEST_ALERT_GENERATED",
        description="Generated test alert",
        module="Alerts",
    )

    db.commit()

    return {
        "message": "Test alert generated successfully",
    }


@router.post("/check-threshold")
def check_threshold_alert(
    value: float,
    alert_type: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = (
        db.query(AlertSetting)
        .filter(
            AlertSetting.user_id == current_user.id,
            AlertSetting.alert_type == alert_type,
            AlertSetting.is_active == 1,
        )
        .first()
    )

    if not alert:
        return {
            "message": "No active alert setting found",
            "alert_triggered": False,
        }

    if value >= alert.threshold_value:
        notification = Notification(
            user_id=current_user.id,
            message=f"Alert triggered: {alert.alert_name}",
            type="warning",
        )

        db.add(notification)
        
        if alert.email_enabled == 1:
            send_email_notification(
        to_email=current_user.email,
        subject=f"Alert Triggered: {alert.alert_name}",
        message=(
            f"Hello {current_user.name},\n\n"
            f"Your alert has been triggered.\n\n"
            f"Alert Name: {alert.alert_name}\n"
            f"Alert Type: {alert.alert_type}\n"
            f"Threshold: {alert.threshold_value}\n"
            f"Current Value: {value}\n\n"
            f"Please review your AI Demand Forecasting dashboard."
            ),
            )

        log_activity(
            db=db,
            user_id=current_user.id,
            action="THRESHOLD_ALERT_TRIGGERED",
            description=f"{alert.alert_type} alert triggered with value {value}",
            module="Alerts",
        )

        db.commit()

        return {
            "message": "Alert triggered",
            "alert_triggered": True,
            "alert": alert,
        }

    return {
        "message": "Threshold not crossed",
        "alert_triggered": False,
    }