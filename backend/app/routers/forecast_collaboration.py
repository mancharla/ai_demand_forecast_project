from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Forecast
from app.models_extended import ForecastComment, ForecastRevision, ProjectActivity
from app.utils.dependencies import get_current_user
from app.services.forecast_collaboration_service import create_revision_snapshot


router = APIRouter(
    prefix="/forecast-collaboration",
    tags=["Forecast Collaboration"],
)


class CommentCreate(BaseModel):
    comment: str


class RevisionCreate(BaseModel):
    change_summary: str = "Forecast revision saved"


@router.post("/comments/{forecast_id}")
def add_forecast_comment(
    forecast_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecast = (
        db.query(Forecast)
        .filter(
            Forecast.id == forecast_id,
            Forecast.user_id == current_user.id,
        )
        .first()
    )

    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    comment = ForecastComment(
        forecast_id=forecast_id,
        user_id=current_user.id,
        comment=payload.comment,
    )

    db.add(comment)

    activity = ProjectActivity(
        project_id=None,
        user_id=current_user.id,
        action="FORECAST_COMMENT_ADDED",
        description=f"Comment added to forecast #{forecast_id}",
    )

    db.add(activity)
    db.commit()
    db.refresh(comment)

    return {
        "message": "Comment added successfully",
        "comment": comment,
    }


@router.get("/comments/{forecast_id}")
def get_forecast_comments(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comments = (
        db.query(ForecastComment)
        .filter(ForecastComment.forecast_id == forecast_id)
        .order_by(ForecastComment.created_at.desc())
        .all()
    )

    return comments


@router.delete("/comments/{comment_id}")
def delete_forecast_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comment = (
        db.query(ForecastComment)
        .filter(
            ForecastComment.id == comment_id,
            ForecastComment.user_id == current_user.id,
        )
        .first()
    )

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}


@router.post("/revisions/{forecast_id}")
def create_forecast_revision(
    forecast_id: int,
    payload: RevisionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecast = (
        db.query(Forecast)
        .filter(
            Forecast.id == forecast_id,
            Forecast.user_id == current_user.id,
        )
        .first()
    )

    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    latest_revision = (
        db.query(ForecastRevision)
        .filter(ForecastRevision.forecast_id == forecast_id)
        .order_by(ForecastRevision.revision_number.desc())
        .first()
    )

    next_revision_number = (
        latest_revision.revision_number + 1
        if latest_revision
        else 1
    )

    snapshot = create_revision_snapshot(forecast)

    revision = ForecastRevision(
        forecast_id=forecast_id,
        user_id=current_user.id,
        revision_number=next_revision_number,
        change_summary=payload.change_summary,
        revision_data=snapshot,
    )

    db.add(revision)

    activity = ProjectActivity(
        project_id=None,
        user_id=current_user.id,
        action="FORECAST_REVISION_CREATED",
        description=f"Revision v{next_revision_number} created for forecast #{forecast_id}",
    )

    db.add(activity)
    db.commit()
    db.refresh(revision)

    return {
        "message": "Forecast revision created successfully",
        "revision": revision,
    }


@router.get("/revisions/{forecast_id}")
def get_forecast_revisions(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    revisions = (
        db.query(ForecastRevision)
        .filter(ForecastRevision.forecast_id == forecast_id)
        .order_by(ForecastRevision.revision_number.desc())
        .all()
    )

    return revisions


@router.delete("/revisions/{revision_id}")
def delete_forecast_revision(
    revision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    revision = (
        db.query(ForecastRevision)
        .filter(
            ForecastRevision.id == revision_id,
            ForecastRevision.user_id == current_user.id,
        )
        .first()
    )

    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")

    db.delete(revision)
    db.commit()

    return {"message": "Revision deleted successfully"}