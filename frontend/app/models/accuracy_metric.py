from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class AccuracyMetric(Base):

    __tablename__ = "accuracy_metrics"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    dataset_id = Column(Integer, ForeignKey("datasets.id"))

    model_name = Column(String(100))

    mae = Column(Float)

    rmse = Column(Float)

    mape = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)