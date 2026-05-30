import os
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity

from app.services.ai_recommendations import (
    product_demand_recommendations,
    customer_buying_behavior_analysis,
    demand_spike_prediction,
    low_stock_prediction,
    inventory_optimization_suggestions,
)


router = APIRouter(
    prefix="/ai-recommendations",
    tags=["Advanced AI Recommendations"],
)

UPLOAD_DIR = "uploads"


def load_dataset_file(dataset):
    file_path = os.path.join(UPLOAD_DIR, dataset.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    if dataset.filename.endswith(".csv"):
        return pd.read_csv(file_path)

    return pd.read_excel(file_path)


@router.get("/{dataset_id}")
def get_ai_recommendations(
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

    df = load_dataset_file(dataset)

    recommendations = {
        "product_demand_recommendations": product_demand_recommendations(df),
        "customer_buying_behavior": customer_buying_behavior_analysis(df),
        "demand_spike_prediction": demand_spike_prediction(df),
        "low_stock_prediction": low_stock_prediction(df),
        "inventory_optimization": inventory_optimization_suggestions(df),
    }

    log_activity(
        db=db,
        user_id=current_user.id,
        action="AI_RECOMMENDATIONS_VIEWED",
        description=f"Viewed AI recommendations for dataset {dataset_id}",
        module="Advanced AI",
    )

    db.commit()

    return recommendations