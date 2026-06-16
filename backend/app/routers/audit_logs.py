from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import OrganizationAuditLog


router = APIRouter(
    prefix="/audit-logs",
    tags=["Organization Audit Logs"],
)


@router.get("/my-logs")
def get_my_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(OrganizationAuditLog)
        .filter(OrganizationAuditLog.user_id == current_user.id)
        .order_by(OrganizationAuditLog.created_at.desc())
        .limit(200)
        .all()
    )


@router.get("/organization/{organization_id}")
def get_organization_audit_logs(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(OrganizationAuditLog)
        .filter(OrganizationAuditLog.organization_id == organization_id)
        .order_by(OrganizationAuditLog.created_at.desc())
        .limit(300)
        .all()
    )


@router.get("/summary")
def audit_log_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    logs = (
        db.query(OrganizationAuditLog)
        .filter(OrganizationAuditLog.user_id == current_user.id)
        .all()
    )

    modules = {}

    for log in logs:
        modules[log.module_name] = modules.get(log.module_name, 0) + 1

    return {
        "total_logs": len(logs),
        "modules": modules,
    }