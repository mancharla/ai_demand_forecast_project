from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Notification(Base):

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String(255))

    message = Column(String(500))

    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)