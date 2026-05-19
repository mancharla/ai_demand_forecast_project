from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)

from app.database import Base

class Dataset(Base):

    __tablename__ = "datasets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    file_name = Column(
        String(255)
    )

    file_path = Column(
        String(255)
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )