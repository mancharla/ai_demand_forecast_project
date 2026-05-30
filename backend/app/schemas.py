from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ==========================================
# AUTH SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


# ==========================================
# DATASET SCHEMAS
# ==========================================

class DatasetResponse(BaseModel):
    id: int
    original_filename: str
    rows_count: int
    columns_count: int
    upload_date: datetime

    class Config:
        from_attributes = True


# ==========================================
# FORECAST SCHEMAS
# ==========================================

class ForecastRequest(BaseModel):
    target_column: str
    model_name: Optional[str] = "auto"
    forecast_periods: Optional[int] = 30


class ForecastResponse(BaseModel):
    id: int
    model_name: str
    target_column: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    accuracy: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================

class NotificationResponse(BaseModel):
    id: int
    message: str
    type: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# ADMIN SCHEMAS
# ==========================================

class UpdateUserRoleRequest(BaseModel):
    role: str
from typing import Optional
from datetime import datetime


# =========================
# Forecast Schedule Schemas
# =========================
class ForecastScheduleCreate(BaseModel):
    dataset_id: int
    schedule_name: str
    forecast_days: int = 30
    interval_type: str = "daily"
    model_type: str = "best"


class ForecastScheduleUpdate(BaseModel):
    schedule_name: Optional[str] = None
    forecast_days: Optional[int] = None
    interval_type: Optional[str] = None
    model_type: Optional[str] = None
    is_active: Optional[int] = None


# =========================
# Integration Schemas
# =========================
class IntegrationCreate(BaseModel):
    integration_name: str
    integration_type: str
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None


class IntegrationUpdate(BaseModel):
    integration_name: Optional[str] = None
    integration_type: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    is_active: Optional[int] = None


# =========================
# Alert Setting Schemas
# =========================
class AlertSettingCreate(BaseModel):
    alert_name: str
    alert_type: str
    threshold_value: float = 0
    email_enabled: int = 0
    in_app_enabled: int = 1


class AlertSettingUpdate(BaseModel):
    alert_name: Optional[str] = None
    alert_type: Optional[str] = None
    threshold_value: Optional[float] = None
    email_enabled: Optional[int] = None
    in_app_enabled: Optional[int] = None
    is_active: Optional[int] = None


# =========================
# User Profile Schemas
# =========================
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    designation: Optional[str] = None
    address: Optional[str] = None


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str


# =========================
# Dashboard Widget Schemas
# =========================
class DashboardWidgetCreate(BaseModel):
    widget_name: str
    widget_type: str
    position: int = 0
    is_visible: int = 1


class DashboardWidgetUpdate(BaseModel):
    widget_name: Optional[str] = None
    widget_type: Optional[str] = None
    position: Optional[int] = None
    is_visible: Optional[int] = None