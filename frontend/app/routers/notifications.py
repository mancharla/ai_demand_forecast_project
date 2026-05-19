from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification
from app.utils.security import verify_token

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials, db):
    token = credentials.credentials
    email = verify_token(token)

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


@router.get("/")
def get_notifications(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": item.id,
            "title": item.title,
            "message": item.message,
            "is_read": item.is_read,
            "created_at": str(item.created_at)
        }
        for item in notifications
    ]


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user.id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True
    db.commit()

    return {
        "message": "Notification marked as read"
    }


@router.put("/mark-all/read")
def mark_all_notifications_read(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    db.query(Notification).filter(
        Notification.user_id == user.id
    ).update({
        Notification.is_read: True
    })

    db.commit()

    return {
        "message": "All notifications marked as read"
    }