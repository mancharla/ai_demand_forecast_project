from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import (
    User,
    Dataset,
    Forecast,
    Report,
    Notification,
)

from app.routers.auth import router as auth_router
from app.routers.dataset import router as dataset_router
from app.routers.forecast import router as forecast_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Demand Forecasting API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(forecast_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "AI Demand Forecasting Backend Running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }