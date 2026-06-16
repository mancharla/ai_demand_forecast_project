from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import (
    Organization,
    OrganizationMember,
    OrganizationSetting,
)


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None
    industry: str | None = None
    country: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    industry: str | None = None
    country: str | None = None
    is_active: int | None = None


class MemberAdd(BaseModel):
    user_id: int
    role: str = "analyst"


class SettingCreate(BaseModel):
    setting_key: str
    setting_value: str | None = None


@router.post("/create")
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    organization = Organization(
        name=payload.name,
        description=payload.description,
        industry=payload.industry,
        country=payload.country,
        owner_id=current_user.id,
        is_active=1,
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    member = OrganizationMember(
        organization_id=organization.id,
        user_id=current_user.id,
        role="owner",
        is_active=1,
    )

    db.add(member)
    db.commit()

    return {
        "message": "Organization created successfully",
        "organization": organization,
    }


@router.get("/my-organizations")
def get_my_organizations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    memberships = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.is_active == 1,
        )
        .all()
    )

    organization_ids = [item.organization_id for item in memberships]

    if not organization_ids:
        return []

    organizations = (
        db.query(Organization)
        .filter(Organization.id.in_(organization_ids))
        .order_by(Organization.created_at.desc())
        .all()
    )

    return organizations


@router.get("/{organization_id}")
def get_organization_detail(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.is_active == 1,
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="No access to organization")

    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id)
        .first()
    )

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    members = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == organization_id)
        .all()
    )

    settings = (
        db.query(OrganizationSetting)
        .filter(OrganizationSetting.organization_id == organization_id)
        .all()
    )

    return {
        "organization": organization,
        "members": members,
        "settings": settings,
        "my_role": membership.role,
    }


@router.put("/{organization_id}")
def update_organization(
    organization_id: int,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.owner_id == current_user.id,
        )
        .first()
    )

    if not organization:
        raise HTTPException(status_code=403, detail="Only owner can update")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(organization, key, value)

    db.commit()
    db.refresh(organization)

    return {
        "message": "Organization updated successfully",
        "organization": organization,
    }


@router.post("/{organization_id}/members")
def add_organization_member(
    organization_id: int,
    payload: MemberAdd,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.owner_id == current_user.id,
        )
        .first()
    )

    if not organization:
        raise HTTPException(status_code=403, detail="Only owner can add members")

    existing = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == payload.user_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="User already member")

    member = OrganizationMember(
        organization_id=organization_id,
        user_id=payload.user_id,
        role=payload.role,
        is_active=1,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "Member added successfully",
        "member": member,
    }


@router.post("/{organization_id}/settings")
def add_organization_setting(
    organization_id: int,
    payload: SettingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.role.in_(["owner", "admin"]),
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Admin access required")

    setting = OrganizationSetting(
        organization_id=organization_id,
        setting_key=payload.setting_key,
        setting_value=payload.setting_value,
    )

    db.add(setting)
    db.commit()
    db.refresh(setting)

    return {
        "message": "Setting saved successfully",
        "setting": setting,
    }


@router.delete("/{organization_id}")
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.owner_id == current_user.id,
        )
        .first()
    )

    if not organization:
        raise HTTPException(status_code=403, detail="Only owner can delete")

    organization.is_active = 0

    db.commit()

    return {
        "message": "Organization deactivated successfully"
    }
@router.get("/{organization_id}/settings/all")
def get_organization_settings(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    settings = (
        db.query(OrganizationSetting)
        .filter(OrganizationSetting.organization_id == organization_id)
        .all()
    )

    result = {}

    for setting in settings:
        result[setting.setting_key] = setting.setting_value

    return result


@router.put("/{organization_id}/settings/bulk")
def update_organization_settings(
    organization_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.role.in_(["owner", "admin"]),
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Admin access required")

    for key, value in payload.items():
        existing = (
            db.query(OrganizationSetting)
            .filter(
                OrganizationSetting.organization_id == organization_id,
                OrganizationSetting.setting_key == key,
            )
            .first()
        )

        if existing:
            existing.setting_value = str(value)
        else:
            setting = OrganizationSetting(
                organization_id=organization_id,
                setting_key=key,
                setting_value=str(value),
            )
            db.add(setting)

    db.commit()

    return {
        "message": "Organization settings updated successfully"
    }