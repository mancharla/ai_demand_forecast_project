from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import (
    User,
    Dataset,
    Forecast,
    Report,
    Notification,
    UserActivityLog,
    APIActivityLog,
)

from app.routers.auth import router as auth_router
from app.routers.dataset import router as dataset_router
from app.routers.forecast import router as forecast_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router
from app.routers.search import router as search_router
from app.routers.automation import router as automation_router
from app.routers import realtime
from app.routers.integration import router as integration_router
from app.routers.alerts import router as alerts_router
from app.routers.ai_recommendations import router as ai_recommendations_router
from app.routers.profile import router as profile_router
from app.routers.widgets import router as widgets_router
from app.routers.real_model_comparison import (
    router as real_model_comparison_router,
)
from app.routers.confidence import router as confidence_router
from app.routers.model_confidence import (
    router as model_confidence_router,
)
from app.services.scheduler_service import (
    start_scheduler,
    stop_scheduler,
)
from app.routers.scheduler_status import router as scheduler_status_router
from app.routers.comparison_reports import router as comparison_reports_router
from app.routers.drilldown_analytics import router as drilldown_router
import time
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM
from app.models import APIActivityLog
from app.database import SessionLocal
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Demand Forecasting API",
    version="1.0.0",
)
from app.limiter import limiter
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

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
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later."
        },
    )
@app.middleware("http")
async def api_activity_middleware(request, call_next):
    start_time = time.time()
    user_id = None

    auth_header = request.headers.get("authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )
            user_id = int(payload.get("sub"))
        except Exception:
            user_id = None

    response = await call_next(request)

    response_time_ms = round(
        (time.time() - start_time) * 1000,
        2,
    )

    db = SessionLocal()

    try:
        log = APIActivityLog(
            user_id=user_id,
            path=str(request.url.path),
            method=request.method,
            status_code=response.status_code,
            response_time_ms=response_time_ms,
        )

        db.add(log)
        db.commit()
    finally:
        db.close()

    return response

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(forecast_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(admin_router)
app.include_router(search_router)
app.include_router(realtime.router)
app.include_router(automation_router)
app.include_router(integration_router)
app.include_router(alerts_router)
app.include_router(ai_recommendations_router)
app.include_router(profile_router)
app.include_router(widgets_router)
app.include_router(real_model_comparison_router)
app.include_router(confidence_router)
app.include_router(model_confidence_router) 
app.include_router(scheduler_status_router)
app.include_router(comparison_reports_router)
app.include_router(drilldown_router)
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
@app.on_event("startup")
def startup_event():
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()