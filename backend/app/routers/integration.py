import requests

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import IntegrationSetting, Notification
from app.schemas import IntegrationCreate, IntegrationUpdate
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/integrations",
    tags=["Enterprise Integrations"],
)


@router.post("/")
def create_integration(
    payload: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    integration = IntegrationSetting(
        user_id=current_user.id,
        integration_name=payload.integration_name,
        integration_type=payload.integration_type,
        api_url=payload.api_url,
        api_key=payload.api_key,
        webhook_url=payload.webhook_url,
    )

    db.add(integration)

    notification = Notification(
        user_id=current_user.id,
        message="Integration setting created successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="INTEGRATION_CREATED",
        description=f"Created integration {payload.integration_name}",
        module="Integration",
    )

    db.commit()
    db.refresh(integration)

    return {
        "message": "Integration created successfully",
        "integration": integration,
    }


@router.get("/")
def get_integrations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    integrations = (
        db.query(IntegrationSetting)
        .filter(IntegrationSetting.user_id == current_user.id)
        .order_by(IntegrationSetting.id.desc())
        .all()
    )

    return integrations


@router.put("/{integration_id}")
def update_integration(
    integration_id: int,
    payload: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    integration = (
        db.query(IntegrationSetting)
        .filter(
            IntegrationSetting.id == integration_id,
            IntegrationSetting.user_id == current_user.id,
        )
        .first()
    )

    if not integration:
        raise HTTPException(
            status_code=404,
            detail="Integration not found",
        )

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(integration, key, value)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="INTEGRATION_UPDATED",
        description=f"Updated integration {integration.id}",
        module="Integration",
    )

    db.commit()
    db.refresh(integration)

    return {
        "message": "Integration updated successfully",
        "integration": integration,
    }


@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    integration = (
        db.query(IntegrationSetting)
        .filter(
            IntegrationSetting.id == integration_id,
            IntegrationSetting.user_id == current_user.id,
        )
        .first()
    )

    if not integration:
        raise HTTPException(
            status_code=404,
            detail="Integration not found",
        )

    db.delete(integration)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="INTEGRATION_DELETED",
        description=f"Deleted integration {integration_id}",
        module="Integration",
    )

    db.commit()

    return {
        "message": "Integration deleted successfully",
    }


@router.post("/{integration_id}/test")
def test_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    integration = (
        db.query(IntegrationSetting)
        .filter(
            IntegrationSetting.id == integration_id,
            IntegrationSetting.user_id == current_user.id,
        )
        .first()
    )

    if not integration:
        raise HTTPException(
            status_code=404,
            detail="Integration not found",
        )

    if not integration.api_url:
        raise HTTPException(
            status_code=400,
            detail="API URL not configured",
        )

    try:
        headers = {}

        if integration.api_key:
            headers["Authorization"] = f"Bearer {integration.api_key}"

        response = requests.get(
            integration.api_url,
            headers=headers,
            timeout=10,
        )

        return {
            "message": "Integration test completed",
            "status_code": response.status_code,
            "success": response.status_code < 400,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/webhook/receive")
def receive_webhook(payload: dict):
    return {
        "message": "Webhook received successfully",
        "data": payload,
    }