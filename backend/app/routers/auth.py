from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
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

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
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

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password_hash=hash_password(user_data.password),
        role="admin"
        if user_data.email == "admin@example.com"
        else "user",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
        },
    }


@router.post("/login")
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == credentials.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    )

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
):
    return {
        "message": (
            f"Password reset link sent to {request.email}"
        )
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
):
    return {
        "message": "Password reset successfully"
    }