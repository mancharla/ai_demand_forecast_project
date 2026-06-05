from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import DashboardLayout
from app.models import DashboardWidget


router = APIRouter(
    prefix="/dashboard-customization",
    tags=["Dashboard Customization"],
)


class LayoutCreate(BaseModel):
    project_id: int
    layout_name: str


class LayoutUpdate(BaseModel):
    layout_name: str | None = None
    is_default: bool | None = None
    widgets: list | dict | None = None


class WidgetCreate(BaseModel):
    widget_name: str
    widget_type: str
    position: int = 0


class WidgetUpdate(BaseModel):
    widget_name: str | None = None
    widget_type: str | None = None
    position: int | None = None
    is_visible: int | None = None


@router.post("/layouts")
def create_layout(
    payload: LayoutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    layout = DashboardLayout(
        user_id=current_user.id,
        project_id=payload.project_id,
        layout_name=payload.layout_name,
        is_default=0,
        widgets=[],
    )

    db.add(layout)
    db.commit()
    db.refresh(layout)

    return {
        "message": "Dashboard layout created successfully",
        "layout": layout,
    }


@router.get("/layouts/project/{project_id}")
def get_project_layouts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    layouts = (
        db.query(DashboardLayout)
        .filter(
            DashboardLayout.project_id == project_id,
            DashboardLayout.user_id == current_user.id,
        )
        .order_by(DashboardLayout.created_at.desc())
        .all()
    )

    return layouts


@router.put("/layouts/{layout_id}")
def update_layout(
    layout_id: int,
    payload: LayoutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    layout = (
        db.query(DashboardLayout)
        .filter(
            DashboardLayout.id == layout_id,
            DashboardLayout.user_id == current_user.id,
        )
        .first()
    )

    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(layout, key, value)

    db.commit()
    db.refresh(layout)

    return {
        "message": "Dashboard layout updated successfully",
        "layout": layout,
    }


@router.delete("/layouts/{layout_id}")
def delete_layout(
    layout_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    layout = (
        db.query(DashboardLayout)
        .filter(
            DashboardLayout.id == layout_id,
            DashboardLayout.user_id == current_user.id,
        )
        .first()
    )

    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")

    db.delete(layout)
    db.commit()

    return {
        "message": "Dashboard layout deleted successfully"
    }


@router.post("/widgets")
def create_widget(
    payload: WidgetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    widget = DashboardWidget(
        user_id=current_user.id,
        widget_name=payload.widget_name,
        widget_type=payload.widget_type,
        position=payload.position,
        is_visible=1,
    )

    db.add(widget)
    db.commit()
    db.refresh(widget)

    return {
        "message": "Dashboard widget created successfully",
        "widget": widget,
    }


@router.get("/widgets")
def get_my_widgets(
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


@router.put("/widgets/{widget_id}")
def update_widget(
    widget_id: int,
    payload: WidgetUpdate,
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
        raise HTTPException(status_code=404, detail="Widget not found")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(widget, key, value)

    db.commit()
    db.refresh(widget)

    return {
        "message": "Dashboard widget updated successfully",
        "widget": widget,
    }


@router.delete("/widgets/{widget_id}")
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
        raise HTTPException(status_code=404, detail="Widget not found")

    db.delete(widget)
    db.commit()

    return {
        "message": "Dashboard widget deleted successfully"
    }