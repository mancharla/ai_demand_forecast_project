from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import Float
from app.database import Base


# =========================
# User Model
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    is_active = Column(Integer, default=1)
    account_status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", back_populates="user")
    forecasts = relationship("Forecast", back_populates="user")
    reports = relationship("Report", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    organization_id = Column(
    Integer,
    ForeignKey("organizations.id"),
    nullable=True
)


# =========================
# Dataset Model
# =========================
class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)

    rows_count = Column(Integer, default=0)
    columns_count = Column(Integer, default=0)

    upload_date = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="datasets")
    forecasts = relationship("Forecast", back_populates="dataset")
    


# =========================
# Forecast Model
# =========================
class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)

    model_name = Column(String(100), nullable=False)
    target_column = Column(String(100), nullable=False)

    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)

    forecast_values = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    dataset_id = Column(Integer, ForeignKey("datasets.id"))

    user = relationship("User", back_populates="forecasts")
    dataset = relationship("Dataset", back_populates="forecasts")


# =========================
# Report Model
# =========================
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf/excel

    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="reports")


# =========================
# Notification Model
# =========================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    message = Column(String(500), nullable=False)
    type = Column(String(50), default="info")
    is_read = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="notifications")
class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

class APIActivityLog(Base):
    __tablename__ = "api_activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    path = Column(String(255), nullable=False)
    method = Column(String(20), nullable=False)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
# =========================
# Forecast Schedule Model
# =========================
class ForecastSchedule(Base):
    __tablename__ = "forecast_schedules"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    dataset_id = Column(Integer, ForeignKey("datasets.id"))

    schedule_name = Column(String(150), nullable=False)
    forecast_days = Column(Integer, default=30)
    interval_type = Column(String(50), default="daily")  # daily/weekly/monthly
    model_type = Column(String(50), default="best")

    is_active = Column(Integer, default=1)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# =========================
# Integration Settings Model
# =========================
class IntegrationSetting(Base):
    __tablename__ = "integration_settings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    integration_name = Column(String(150), nullable=False)
    integration_type = Column(String(100), nullable=False)  # ERP/inventory/webhook/API
    api_url = Column(String(500), nullable=True)
    api_key = Column(String(500), nullable=True)
    webhook_url = Column(String(500), nullable=True)

    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================
# Alert Setting Model
# =========================
class AlertSetting(Base):
    __tablename__ = "alert_settings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    alert_name = Column(String(150), nullable=False)
    alert_type = Column(String(100), nullable=False)  # low_stock/demand_spike/forecast_failure
    threshold_value = Column(Float, default=0)

    email_enabled = Column(Integer, default=0)
    in_app_enabled = Column(Integer, default=1)
    is_active = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)


# =========================
# User Profile Model
# =========================
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    company_name = Column(String(150), nullable=True)
    designation = Column(String(100), nullable=True)
    address = Column(String(300), nullable=True)
    profile_image = Column(String(500), nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow)


# =========================
# Dashboard Widget Model
# =========================
class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    widget_name = Column(String(150), nullable=False)
    widget_type = Column(String(100), nullable=False)
    position = Column(Integer, default=0)
    is_visible = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)