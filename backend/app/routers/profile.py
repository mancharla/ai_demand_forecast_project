from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserProfile
from app.schemas import UserProfileUpdate, PasswordUpdate
from app.utils.dependencies import get_current_user
from app.utils.security import verify_password, hash_password
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/profile",
    tags=["User Profile"],
)


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    return {
        "user": current_user,
        "profile": profile,
    }


@router.put("/me")
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if payload.name is not None:
        user.name = payload.name

    if payload.phone_number is not None:
        user.phone_number = payload.phone_number

    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.company_name is not None:
        profile.company_name = payload.company_name

    if payload.designation is not None:
        profile.designation = payload.designation

    if payload.address is not None:
        profile.address = payload.address

    log_activity(
        db=db,
        user_id=current_user.id,
        action="PROFILE_UPDATED",
        description="Updated user profile",
        module="Profile",
    )

    db.commit()

    return {
        "message": "Profile updated successfully",
    }


@router.put("/password")
def update_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Old password is incorrect",
        )

    user.password_hash = hash_password(payload.new_password)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="PASSWORD_UPDATED",
        description="Updated account password",
        module="Profile",
    )

    db.commit()

    return {
        "message": "Password updated successfully",
    }