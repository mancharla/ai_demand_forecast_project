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
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", back_populates="user")
    forecasts = relationship("Forecast", back_populates="user")
    reports = relationship("Report", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


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