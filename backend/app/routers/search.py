import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Dataset, Forecast, Notification
from app.utils.dependencies import get_current_admin

router = APIRouter(
    prefix="/search",
    tags=["Global Search"],
)


@router.get("/")
def global_search(
    q: str = Query(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    keyword = f"%{q}%"

    users = (
        db.query(User)
        .filter(
            (User.name.like(keyword))
            | (User.email.like(keyword))
            | (User.role.like(keyword))
        )
        .limit(10)
        .all()
    )

    datasets = (
        db.query(Dataset)
        .filter(Dataset.original_filename.like(keyword))
        .limit(10)
        .all()
    )

    forecasts = db.query(Forecast).limit(50).all()

    matched_forecasts = []

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        product = value.get("product", "")

        if q.lower() in product.lower() or q.lower() in forecast.model_name.lower():
            matched_forecasts.append(
                {
                    "id": forecast.id,
                    "product": product,
                    "model_name": forecast.model_name,
                    "dataset_id": forecast.dataset_id,
                    "created_at": forecast.created_at,
                }
            )

    notifications = (
        db.query(Notification)
        .filter(Notification.message.like(keyword))
        .limit(10)
        .all()
    )

    return {
        "users": users,
        "datasets": datasets,
        "forecasts": matched_forecasts[:10],
        "notifications": notifications,
    }