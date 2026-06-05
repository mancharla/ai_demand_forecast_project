from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset
from app.models_extended import DatasetVersion, ProjectDataset
from app.utils.dependencies import get_current_user

from app.services.dataset_versioning import (
    get_dataset_file_path,
    read_dataset_stats,
    create_dataset_version_file,
    compare_dataset_files,
)


router = APIRouter(
    prefix="/dataset-versions",
    tags=["Dataset Versions"],
)


class CompareVersionsRequest(BaseModel):
    version_id_1: int
    version_id_2: int


@router.post("/create/{dataset_id}")
def create_dataset_version(
    dataset_id: int,
    change_description: str = "Dataset version created",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == current_user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    latest_version = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_number.desc())
        .first()
    )

    next_version_number = (
        latest_version.version_number + 1
        if latest_version
        else 1
    )

    file_path = get_dataset_file_path(dataset)

    if not file_path:
        raise HTTPException(
            status_code=404,
            detail="Dataset file path not found",
        )

    stats = read_dataset_stats(file_path)

    version_file_path = create_dataset_version_file(
        dataset,
        next_version_number,
    )

    version = DatasetVersion(
        dataset_id=dataset.id,
        user_id=current_user.id,
        version_number=next_version_number,
        change_description=change_description,
        file_path=version_file_path,
        rows_count=stats["rows_count"],
        columns_count=stats["columns_count"],
        file_size_mb=stats["file_size_mb"],
        is_archived=False,
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return {
        "message": "Dataset version created successfully",
        "version": version,
    }


@router.get("/dataset/{dataset_id}")
def get_dataset_versions(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    versions = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_number.desc())
        .all()
    )

    return versions


@router.get("/project/{project_id}")
def get_project_dataset_versions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project_datasets = (
        db.query(ProjectDataset)
        .filter(ProjectDataset.project_id == project_id)
        .all()
    )

    dataset_ids = [
        item.dataset_id
        for item in project_datasets
    ]

    if not dataset_ids:
        return []

    versions = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id.in_(dataset_ids))
        .order_by(DatasetVersion.created_at.desc())
        .all()
    )

    return versions


@router.post("/compare")
def compare_dataset_versions(
    payload: CompareVersionsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    version_1 = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.id == payload.version_id_1)
        .first()
    )

    version_2 = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.id == payload.version_id_2)
        .first()
    )

    if not version_1 or not version_2:
        raise HTTPException(
            status_code=404,
            detail="One or both versions not found",
        )

    if not version_1.file_path or not version_2.file_path:
        raise HTTPException(
            status_code=404,
            detail="Version file path missing",
        )

    result = compare_dataset_files(
        version_1.file_path,
        version_2.file_path,
    )

    return {
        "version_1": version_1,
        "version_2": version_2,
        "comparison": result,
    }


@router.put("/{version_id}/archive")
def archive_dataset_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    version = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.id == version_id)
        .first()
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Dataset version not found",
        )

    version.is_archived = True

    db.commit()
    db.refresh(version)

    return {
        "message": "Dataset version archived",
        "version": version,
    }


@router.delete("/{version_id}")
def delete_dataset_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    version = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.id == version_id)
        .first()
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Dataset version not found",
        )

    db.delete(version)
    db.commit()

    return {
        "message": "Dataset version deleted successfully",
    }