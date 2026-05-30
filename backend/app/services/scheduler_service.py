import os
import json
import pandas as pd
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import (
    ForecastSchedule,
    Dataset,
    Forecast,
    Notification,
    User,
)
from app.services.activity_logger import log_activity
from app.services.email_service import send_email_notification
from app.services.forecasting import generate_product_forecast


scheduler = BackgroundScheduler()


def calculate_next_run(interval_type: str):
    now = datetime.utcnow()

    if interval_type == "daily":
        return now + timedelta(days=1)

    if interval_type == "weekly":
        return now + timedelta(weeks=1)

    if interval_type == "monthly":
        return now + timedelta(days=30)

    return now + timedelta(days=1)


def load_dataset(dataset: Dataset):
    file_path = os.path.join("uploads", dataset.filename)

    if not os.path.exists(file_path):
        raise FileNotFoundError("Dataset file not found")

    if dataset.filename.endswith(".csv"):
        return pd.read_csv(file_path)

    return pd.read_excel(file_path)


def run_due_forecast_schedules():
    db: Session = SessionLocal()

    try:
        now = datetime.utcnow()

        schedules = (
            db.query(ForecastSchedule)
            .filter(
                ForecastSchedule.is_active == 1,
                ForecastSchedule.next_run_at <= now,
            )
            .all()
        )

        for schedule in schedules:
            try:
                dataset = (
                    db.query(Dataset)
                    .filter(Dataset.id == schedule.dataset_id)
                    .first()
                )

                user = (
                    db.query(User)
                    .filter(User.id == schedule.user_id)
                    .first()
                )

                if not dataset or not user:
                    continue

                df = load_dataset(dataset)

                result = generate_product_forecast(
                    df,
                    forecast_days=schedule.forecast_days,
                )

                forecasts = result.get("forecast", [])

                for item in forecasts:
                    forecast = Forecast(
                        model_name=item.get(
                            "model_used",
                            schedule.model_type or "Auto",
                        ),
                        target_column="Sales",
                        mae=result.get("model_comparison", {})
                        .get("best_model", {})
                        .get("mae", 0),
                        rmse=result.get("model_comparison", {})
                        .get("best_model", {})
                        .get("rmse", 0),
                        mape=result.get("model_comparison", {})
                        .get("best_model", {})
                        .get("mape", 0),
                        accuracy=(
                            100
                            - result.get("model_comparison", {})
                            .get("best_model", {})
                            .get("mape", 0)
                        ),
                        forecast_values=json.dumps(item),
                        user_id=user.id,
                        dataset_id=dataset.id,
                    )

                    db.add(forecast)

                notification = Notification(
                    user_id=user.id,
                    message=f"Scheduled forecast completed: {schedule.schedule_name}",
                    type="success",
                )

                db.add(notification)

                send_email_notification(
                    to_email=user.email,
                    subject="Scheduled Forecast Completed",
                    message=(
                        f"Hello {user.name},\n\n"
                        f"Your scheduled forecast has completed successfully.\n\n"
                        f"Schedule: {schedule.schedule_name}\n"
                        f"Dataset: {dataset.original_filename}\n"
                        f"Forecast Days: {schedule.forecast_days}\n\n"
                        f"Please check your AI Demand Forecasting dashboard."
                    ),
                )

                log_activity(
                    db=db,
                    user_id=user.id,
                    action="SCHEDULED_FORECAST_COMPLETED",
                    description=f"Scheduled forecast completed for schedule {schedule.id}",
                    module="Automation",
                )

                schedule.last_run_at = now
                schedule.next_run_at = calculate_next_run(
                    schedule.interval_type
                )

                db.commit()

            except Exception as e:
                db.rollback()

                if schedule.user_id:
                    notification = Notification(
                        user_id=schedule.user_id,
                        message=f"Scheduled forecast failed: {str(e)}",
                        type="error",
                    )
                    db.add(notification)
                    db.commit()

    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_due_forecast_schedules,
            "interval",
            minutes=1,
            id="scheduled_forecast_runner",
            replace_existing=True,
        )

        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()