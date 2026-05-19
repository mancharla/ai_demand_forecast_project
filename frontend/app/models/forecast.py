from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey
)

from app.database import Base

class Forecast(Base):

    __tablename__ = "forecasts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_name = Column(
        String(255)
    )

    predicted_sales = Column(
        Float
    )

    dataset_id = Column(
        Integer,
        ForeignKey("datasets.id")
    )