from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user

from app.models_extended import (
    ForecastProject,
    ModelPerformance,
)

from app.services.model_performance_tracker import (
    generate_model_performance_metrics,
)

router = APIRouter(
    prefix="/model-performance",
    tags=["Model Performance"],
)


@router.post("/generate/{project_id}")
def generate_model_performance(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(ForecastProject)
        .filter(
            ForecastProject.id == project_id,
            ForecastProject.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    old_records = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.project_id == project_id
        )
        .all()
    )

    for item in old_records:
        db.delete(item)

    metrics = generate_model_performance_metrics(
        project_id
    )

    saved = []

    for metric in metrics:
        row = ModelPerformance(
            project_id=project_id,
            model_name=metric["model_name"],
            mae=metric["mae"],
            rmse=metric["rmse"],
            mape=metric["mape"],
            accuracy_score=metric["accuracy_score"],
            model_rank=metric["model_rank"],
        )

        db.add(row)
        saved.append(row)

    db.commit()

    return {
        "message": "Model performance generated",
        "count": len(saved),
    }


@router.get("/project/{project_id}")
def get_model_performance(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rows = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.project_id == project_id
        )
        .order_by(
            ModelPerformance.model_rank.asc()
        )
        .all()
    )

    return rows


@router.get("/best-model/{project_id}")
def get_best_model(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    best = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.project_id == project_id
        )
        .order_by(
            ModelPerformance.accuracy_score.desc()
        )
        .first()
    )

    if not best:
        raise HTTPException(
            status_code=404,
            detail="No model performance data",
        )

    return best


@router.get("/trends/{project_id}")
def get_performance_trends(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    records = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.project_id == project_id
        )
        .order_by(
            ModelPerformance.created_at.asc()
        )
        .all()
    )

    return records


@router.delete("/{performance_id}")
def delete_performance_record(
    performance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    row = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.id == performance_id
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Record not found",
        )

    db.delete(row)
    db.commit()

    return {
        "message": "Deleted successfully"
    }