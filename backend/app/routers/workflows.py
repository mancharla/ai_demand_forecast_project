from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification
from app.models_extended import Workflow, WorkflowExecutionLog
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/workflows",
    tags=["Workflow Automation"],
)


class WorkflowCreate(BaseModel):
    organization_id: int | None = None
    workflow_name: str
    workflow_type: str
    trigger_type: str = "manual"
    configuration: dict | None = None


@router.post("/create")
def create_workflow(
    payload: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    workflow = Workflow(
        organization_id=payload.organization_id,
        workflow_name=payload.workflow_name,
        workflow_type=payload.workflow_type,
        trigger_type=payload.trigger_type,
        configuration=payload.configuration,
        created_by=current_user.id,
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return {
        "message": "Workflow created",
        "workflow": workflow,
    }


@router.get("/my-workflows")
def get_workflows(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Workflow)
        .filter(Workflow.created_by == current_user.id)
        .order_by(Workflow.created_at.desc())
        .all()
    )


@router.post("/{workflow_id}/execute")
def execute_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id)
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found",
        )

    started_at = datetime.utcnow()

    try:
        if workflow.workflow_type == "forecast_generation":
            message = "Forecast generation workflow executed successfully"

        elif workflow.workflow_type == "report_generation":
            message = "Report generation workflow executed successfully"

        elif workflow.workflow_type == "notification":
            notification = Notification(
                user_id=current_user.id,
                message=f"Workflow notification executed: {workflow.workflow_name}",
                type="info",
            )

            db.add(notification)

            message = "Notification workflow executed successfully"

        else:
            message = "Custom workflow executed successfully"

        log = WorkflowExecutionLog(
            workflow_id=workflow.id,
            execution_status="success",
            execution_message=message,
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "message": message,
            "workflow_type": workflow.workflow_type,
            "log_id": log.id,
        }

    except Exception as e:
        db.rollback()

        error_log = WorkflowExecutionLog(
            workflow_id=workflow.id,
            execution_status="failed",
            execution_message=str(e),
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )

        db.add(error_log)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/{workflow_id}/logs")
def workflow_logs(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(WorkflowExecutionLog)
        .filter(WorkflowExecutionLog.workflow_id == workflow_id)
        .order_by(WorkflowExecutionLog.started_at.desc())
        .all()
    )