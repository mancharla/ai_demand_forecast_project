from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserLogin,
    ForgotPassword,
    ResetPassword
)

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
    }


@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    valid_password = verify_password(
        user.password,
        existing_user.password
    )

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "role": existing_user.role or "user"
        }
    }


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPassword,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email not found"
        )

    return {
        "message": "Email verified successfully"
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password = hash_password(data.new_password)

    db.commit()

    return {
        "message": "Password reset successful"
    }