from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter(
    prefix="/realtime",
    tags=["Realtime"]
)

@router.get("/dashboard")
def realtime_dashboard():

    return {
        "timestamp": datetime.utcnow(),

        "live_sales": random.randint(5000, 50000),

        "active_users": random.randint(5, 100),

        "forecast_accuracy": round(
            random.uniform(80, 99),
            2
        ),

        "system_load": round(
            random.uniform(10, 90),
            2
        ),

        "new_orders": random.randint(1, 50)
    }