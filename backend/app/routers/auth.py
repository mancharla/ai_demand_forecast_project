from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Request
from app.limiter import limiter
from app.database import get_db
from app.models import User, Notification
from app.schemas import (
    UserRegister,
    UserLogin,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.services.activity_logger import log_activity

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/register")
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    hashed_password = hash_password(user_data.password)

    role = (
        "super_admin"
        if user_data.email.lower() == "rakesh@gmail.com"
        else "user"
    )

    user = User(
        name=user_data.name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password_hash=hashed_password,
        role=role,
    )

    db.add(user)
    db.flush()

    notification = Notification(
        user_id=user.id,
        message="Account created successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=user.id,
        action="REGISTER",
        description=f"{user.name} registered account",
        module="Authentication",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Only keep this block if your User model has these columns
    if hasattr(user, "account_status"):
        if user.account_status != "active":
            raise HTTPException(
                status_code=403,
                detail="Your account is not active. Please contact admin.",
            )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    )

    notification = Notification(
        user_id=user.id,
        message="Login successful",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=user.id,
        action="LOGIN",
        description=f"{user.name} logged in",
        module="Authentication",
    )

    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "message": "Password reset request accepted",
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.password_hash = hash_password(
        request.new_password
    )

    notification = Notification(
        user_id=user.id,
        message="Password updated successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=user.id,
        action="PASSWORD_RESET",
        description=f"{user.name} reset password",
        module="Authentication",
    )

    db.commit()

    return {
        "message": "Password reset successful",
    }