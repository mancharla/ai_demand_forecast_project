from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models import AlertSetting
from app.models import Notification
from app.services.alert_engine import evaluate_alert


router = APIRouter(
    prefix="/alert-settings",
    tags=["Alert Settings"],
)


class AlertCreate(BaseModel):
    alert_name: str
    alert_type: str
    threshold_value: float
    email_enabled: int = 0
    in_app_enabled: int = 1
    is_active: int = 1


class AlertUpdate(BaseModel):
    alert_name: str | None = None
    alert_type: str | None = None
    threshold_value: float | None = None
    email_enabled: int | None = None
    in_app_enabled: int | None = None
    is_active: int | None = None


@router.post("/create")
def create_alert_setting(
    payload: AlertCreate,
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
        is_active=payload.is_active,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert setting created successfully",
        "alert": alert,
    }


@router.get("/my-alerts")
def get_my_alerts(
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


@router.put("/{alert_id}")
def update_alert_setting(
    alert_id: int,
    payload: AlertUpdate,
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
        raise HTTPException(status_code=404, detail="Alert setting not found")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(alert, key, value)

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert setting updated successfully",
        "alert": alert,
    }


@router.delete("/{alert_id}")
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
        raise HTTPException(status_code=404, detail="Alert setting not found")

    db.delete(alert)
    db.commit()

    return {"message": "Alert setting deleted successfully"}


@router.post("/check")
def check_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alerts = (
        db.query(AlertSetting)
        .filter(
            AlertSetting.user_id == current_user.id,
            AlertSetting.is_active == 1,
        )
        .all()
    )

    generated = []

    latest_accuracy = 78.5
    demand_growth = 32.0

    for alert in alerts:
        result = evaluate_alert(
            alert,
            latest_accuracy=latest_accuracy,
            demand_growth=demand_growth,
        )

        if result["triggered"]:
            notification = Notification(
                user_id=current_user.id,
                message=result["message"],
                type="warning",
            )

            db.add(notification)
            generated.append(result["message"])

    db.commit()

    return {
        "message": "Alert check completed",
        "generated_alerts": generated,
        "count": len(generated),
    }