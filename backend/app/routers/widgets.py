from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DashboardWidget
from app.schemas import DashboardWidgetCreate, DashboardWidgetUpdate
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/widgets",
    tags=["Dashboard Widgets"],
)


@router.post("/")
def create_widget(
    payload: DashboardWidgetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widget = DashboardWidget(
        user_id=current_user.id,
        widget_name=payload.widget_name,
        widget_type=payload.widget_type,
        position=payload.position,
        is_visible=payload.is_visible,
    )

    db.add(widget)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DASHBOARD_WIDGET_CREATED",
        description=f"Created dashboard widget {payload.widget_name}",
        module="Dashboard",
    )

    db.commit()
    db.refresh(widget)

    return {
        "message": "Widget created successfully",
        "widget": widget,
    }


@router.get("/")
def get_widgets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widgets = (
        db.query(DashboardWidget)
        .filter(DashboardWidget.user_id == current_user.id)
        .order_by(DashboardWidget.position.asc())
        .all()
    )

    return widgets


@router.put("/{widget_id}")
def update_widget(
    widget_id: int,
    payload: DashboardWidgetUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widget = (
        db.query(DashboardWidget)
        .filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.user_id == current_user.id,
        )
        .first()
    )

    if not widget:
        raise HTTPException(
            status_code=404,
            detail="Widget not found",
        )

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(widget, key, value)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DASHBOARD_WIDGET_UPDATED",
        description=f"Updated dashboard widget {widget.id}",
        module="Dashboard",
    )

    db.commit()
    db.refresh(widget)

    return {
        "message": "Widget updated successfully",
        "widget": widget,
    }


@router.delete("/{widget_id}")
def delete_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widget = (
        db.query(DashboardWidget)
        .filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.user_id == current_user.id,
        )
        .first()
    )

    if not widget:
        raise HTTPException(
            status_code=404,
            detail="Widget not found",
        )

    db.delete(widget)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DASHBOARD_WIDGET_DELETED",
        description=f"Deleted dashboard widget {widget_id}",
        module="Dashboard",
    )

    db.commit()

    return {
        "message": "Widget deleted successfully",
    }
@router.put("/reorder/{widget_id}")
def reorder_widget(
    widget_id: int,
    direction: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widget = (
        db.query(DashboardWidget)
        .filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.user_id == current_user.id,
        )
        .first()
    )

    if not widget:
        raise HTTPException(
            status_code=404,
            detail="Widget not found",
        )

    if direction not in ["up", "down"]:
        raise HTTPException(
            status_code=400,
            detail="Direction must be up or down",
        )

    if direction == "up":
        widget.position = max(1, widget.position - 1)

    if direction == "down":
        widget.position = widget.position + 1

    db.commit()
    db.refresh(widget)

    return {
        "message": "Widget reordered successfully",
        "widget": {
            "id": widget.id,
            "position": widget.position,
        },
    }