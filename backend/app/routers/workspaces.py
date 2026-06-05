"""
API routes for Forecast Workspace Management - Phase 1
Handles: Projects, Team Management, Activity Tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Dataset
from app.models_extended import (
    ForecastProject, ProjectMember, ProjectActivity,
    ProjectDataset, ProjectForecast, ForecastComment,
    DatasetVersion, BusinessKPI, AIInsight
)
from app.schemas_extended import (
    ForecastProjectCreate, ForecastProjectUpdate, ForecastProjectResponse, 
    ForecastProjectDetailResponse, ProjectMemberCreate, ProjectMemberResponse,
    ProjectActivityResponse, ForecastCommentCreate, ForecastCommentResponse
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


# =========================
# PROJECT MANAGEMENT
# =========================

@router.post("/", response_model=ForecastProjectResponse, status_code=201)
def create_project(
    project: ForecastProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new forecast project/workspace"""
    new_project = ForecastProject(
        name=project.name,
        description=project.description,
        owner_id=current_user.id,
        color_tag=project.color_tag,
        is_public=project.is_public
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # Add owner as admin member
    owner_member = ProjectMember(
        project_id=new_project.id,
        user_id=current_user.id,
        role="owner",
        can_edit=True,
        can_delete=True,
        can_share=True,
        can_export=True,
        can_collaborate=True
    )
    db.add(owner_member)
    db.commit()
    
    return new_project


@router.get("/", response_model=List[ForecastProjectResponse])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    is_archived: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all projects for current user (owned or member)"""
    query = db.query(ForecastProject).join(ProjectMember).filter(
        (ForecastProject.owner_id == current_user.id) |
        (ProjectMember.user_id == current_user.id)
    )
    
    if is_archived is not None:
        query = query.filter(ForecastProject.is_archived == is_archived)
    
    projects = query.offset(skip).limit(limit).all()
    return projects


@router.get("/{project_id}", response_model=ForecastProjectDetailResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed project information"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if project.owner_id != current_user.id and not is_member and not project.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    activity_count = db.query(ProjectActivity).filter(
        ProjectActivity.project_id == project_id
    ).count()
    
    project.activity_count = activity_count
    return project


@router.put("/{project_id}", response_model=ForecastProjectResponse)
def update_project(
    project_id: int,
    project_update: ForecastProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project details"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is owner or editor
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if project.owner_id != current_user.id and (not member or not member.can_edit):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Update fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    # Log activity
    log_project_activity(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
        action="updated",
        entity_type="project",
        description=f"Updated project {project.name}"
    )
    
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project (owner only)"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete project")
    
    db.delete(project)
    db.commit()
    
    return None


@router.post("/{project_id}/archive", response_model=ForecastProjectResponse)
def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Archive a project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can archive project")
    
    project.is_archived = True
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    return project


# =========================
# TEAM & PERMISSIONS
# =========================

@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=201)
def add_project_member(
    project_id: int,
    member: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a team member to project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can add members")
    
    # Check if already member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    
    new_member = ProjectMember(
        project_id=project_id,
        user_id=member.user_id,
        role=member.role,
        can_edit=member.can_edit,
        can_delete=member.can_delete,
        can_share=member.can_share,
        can_export=member.can_export
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    log_project_activity(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
        action="member_added",
        entity_type="member",
        entity_id=new_member.user_id,
        description=f"Added user {new_member.user_id} as {new_member.role}"
    )
    
    return new_member


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all members of a project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()
    
    return members


@router.put("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
def update_member_role(
    project_id: int,
    user_id: int,
    member_update: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update member permissions"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can modify members")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member.role = member_update.role
    member.can_edit = member_update.can_edit
    member.can_delete = member_update.can_delete
    member.can_share = member_update.can_share
    member.can_export = member_update.can_export
    
    db.commit()
    db.refresh(member)
    
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can remove members")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove project owner")
    
    db.delete(member)
    db.commit()
    
    return None


# =========================
# ACTIVITY TRACKING
# =========================

@router.get("/{project_id}/activity", response_model=List[ProjectActivityResponse])
def get_project_activity(
    project_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project activity timeline"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    activity = db.query(ProjectActivity).filter(
        ProjectActivity.project_id == project_id
    ).order_by(ProjectActivity.created_at.desc()).offset(skip).limit(limit).all()
    
    return activity


class ProjectDatasetAttach(BaseModel):
    dataset_id: int


# =========================
# DATASET MANAGEMENT
# =========================

@router.get("/{project_id}/datasets")
def get_project_datasets(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    datasets = db.query(ProjectDataset).filter(
        ProjectDataset.project_id == project_id
    ).all()

    return [
        {
            "dataset_id": association.dataset_id,
            "file_name": association.dataset.original_filename,
            "rows_count": association.dataset.rows_count,
            "columns_count": association.dataset.columns_count,
            "uploaded_at": association.dataset.upload_date,
            "project_dataset_id": association.id,
        }
        for association in datasets
        if association.dataset is not None
    ]


@router.post("/{project_id}/datasets", status_code=201)
def attach_dataset_to_project(
    project_id: int,
    payload: ProjectDatasetAttach,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.id != project.owner_id:
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        ).first()
        if not member and not project.is_public:
            raise HTTPException(status_code=403, detail="Permission denied")

    dataset = db.query(Dataset).filter(
        Dataset.id == payload.dataset_id,
        Dataset.user_id == current_user.id,
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    existing = db.query(ProjectDataset).filter(
        ProjectDataset.project_id == project_id,
        ProjectDataset.dataset_id == dataset.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dataset already attached to the project")

    association = ProjectDataset(
        project_id=project_id,
        dataset_id=dataset.id,
    )
    db.add(association)
    project.total_datasets = (project.total_datasets or 0) + 1
    db.commit()

    return {
        "message": "Dataset attached to project successfully",
        "dataset_id": dataset.id,
    }


@router.delete("/{project_id}/datasets/{dataset_id}", status_code=204)
def remove_project_dataset(
    project_id: int,
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.id != project.owner_id:
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        ).first()
        if not member and not project.is_public:
            raise HTTPException(status_code=403, detail="Permission denied")

    association = db.query(ProjectDataset).filter(
        ProjectDataset.project_id == project_id,
        ProjectDataset.dataset_id == dataset_id,
    ).first()
    if not association:
        raise HTTPException(status_code=404, detail="Project dataset not found")

    db.delete(association)
    project.total_datasets = max((project.total_datasets or 1) - 1, 0)
    db.commit()
    return None


# =========================
# COMMENTS & COLLABORATION
# =========================

@router.post("/{project_id}/comments", response_model=ForecastCommentResponse, status_code=201)
def add_comment(
    project_id: int,
    comment: ForecastCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add comment to forecast or project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_comment = ForecastComment(
        project_id=project_id,
        forecast_id=comment.forecast_id,
        user_id=current_user.id,
        content=comment.content,
        comment_type=comment.comment_type,
        parent_comment_id=comment.parent_comment_id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    log_project_activity(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
        action="commented",
        entity_type="comment",
        entity_id=new_comment.id,
        description=f"Added comment: {comment.content[:50]}..."
    )
    
    return new_comment


@router.get("/{project_id}/comments", response_model=List[ForecastCommentResponse])
def get_comments(
    project_id: int,
    forecast_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comments for project or specific forecast"""
    query = db.query(ForecastComment).filter(ForecastComment.project_id == project_id)
    
    if forecast_id:
        query = query.filter(ForecastComment.forecast_id == forecast_id)
    
    comments = query.order_by(ForecastComment.created_at.desc()).offset(skip).limit(limit).all()
    return comments


# =========================
# HELPER FUNCTIONS
# =========================

def log_project_activity(
    db: Session,
    project_id: int,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    description: Optional[str] = None,
    changes: Optional[dict] = None
):
    """Log an activity in the project"""
    activity = ProjectActivity(
        project_id=project_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        changes=changes
    )
    db.add(activity)
    db.commit()
