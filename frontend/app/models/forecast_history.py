from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class ForecastHistory(Base):

    __tablename__ = "forecast_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    dataset_id = Column(Integer, ForeignKey("datasets.id"))

    model_name = Column(String(100))

    forecast_days = Column(Integer)

    top_demand_product = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)