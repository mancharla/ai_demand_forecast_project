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