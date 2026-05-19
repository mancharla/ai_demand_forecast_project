from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    engine,
    Base
)

# MODELS
from app.models.user import User
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.models.notification import Notification
from app.models.forecast_history import ForecastHistory
from app.models.accuracy_metric import AccuracyMetric


# ROUTERS
from app.routers.auth import router as auth_router
from app.routers.dataset import router as dataset_router
from app.routers.forecast import router as forecast_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router
app = FastAPI()

# ==============================
# CORS CONFIGURATION
# ==============================
app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# CREATE TABLES
Base.metadata.create_all(bind=engine)

# INCLUDE ROUTERS
app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(forecast_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(admin_router)

@app.get("/")
def home():

    return {
        "message": "AI Demand Forecasting API Running"
    }