import os
import json
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Forecast
from app.utils.dependencies import get_current_user
from app.services.real_model_comparison import compare_real_models


router = APIRouter(
    prefix="/real-model-comparison",
    tags=["Real Model Comparison"],
)


@router.get("/{dataset_id}")
def compare_models(
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

    file_path = os.path.join("uploads", dataset.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        results = compare_real_models(df)

        old_metrics = (
            db.query(Forecast)
            .filter(
                Forecast.user_id == current_user.id,
                Forecast.dataset_id == dataset.id,
                Forecast.forecast_values.like("%model_comparison_metric%"),
            )
            .all()
        )

        for old in old_metrics:
            db.delete(old)

        db.commit()

        for model in results["models"]:
            forecast_record = Forecast(
                model_name=model["model"],
                target_column="Sales",
                mae=model["mae"],
                rmse=model["rmse"],
                mape=model["mape"],
                accuracy=model["accuracy"],
                forecast_values=json.dumps(
                    {
                        "type": "model_comparison_metric",
                        "model": model["model"],
                        "accuracy": model["accuracy"],
                        "mae": model["mae"],
                        "rmse": model["rmse"],
                        "mape": model["mape"],
                    }
                ),
                user_id=current_user.id,
                dataset_id=dataset.id,
            )

            db.add(forecast_record)

        db.commit()

        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.original_filename,
            "best_model": results["best_model"],
            "models": results["models"],
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )