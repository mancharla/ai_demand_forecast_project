import os
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset
from app.utils.dependencies import get_current_user

from app.services.real_model_comparison import compare_real_models

router = APIRouter(
    prefix="/model-confidence",
    tags=["Model Confidence"],
)


@router.get("/{dataset_id}")
def get_model_confidence(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == current_user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    file_path = os.path.join(
        "uploads",
        dataset.filename,
    )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    result = compare_real_models(df)

    confidence = []

    for model in result["models"]:
        score = float(model["accuracy"])

        if score >= 90:
            level = "High"
        elif score >= 75:
            level = "Medium"
        else:
            level = "Low"

        confidence.append({
            "model_name": model["model"],
            "confidence_score": score,
            "confidence_level": level,
            "mae": model["mae"],
            "rmse": model["rmse"],
            "mape": model["mape"],
        })

    return confidence