from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Forecast
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/confidence",
    tags=["Forecast Confidence"],
)


@router.get("/")
def get_forecast_confidence(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    latest_forecast = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.id.desc())
        .first()
    )

    if not latest_forecast:
        return []

    base_accuracy = float(latest_forecast.accuracy or 0)
    base_mape = float(latest_forecast.mape or 0)

    if base_accuracy <= 0 and base_mape > 0:
        base_accuracy = max(0, 100 - base_mape)

    if base_accuracy <= 0:
        base_accuracy = 75

    models = [
        {
            "model_name": "Linear Regression",
            "confidence_score": max(0, round(base_accuracy - 5, 2)),
        },
        {
            "model_name": "Random Forest",
            "confidence_score": round(base_accuracy, 2),
        },
        {
            "model_name": "XGBoost",
            "confidence_score": min(100, round(base_accuracy + 3, 2)),
        },
    ]

    final_data = []

    for item in models:
        score = item["confidence_score"]

        if score >= 85:
            level = "High"
        elif score >= 70:
            level = "Medium"
        else:
            level = "Low"

        final_data.append(
            {
                "id": item["model_name"],
                "dataset_id": latest_forecast.dataset_id,
                "model_name": item["model_name"],
                "confidence_score": score,
                "confidence_level": level,
                "created_at": latest_forecast.created_at,
            }
        )

    return final_data