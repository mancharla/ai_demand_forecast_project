import os
import uuid
import pandas as pd
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, Notification
from app.models_extended import ForecastProject, ProjectDataset, ProjectMember
from app.utils.dependencies import get_current_user
from app.services.activity_logger import log_activity
from app.services.cache import clear_cache

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    if not (
        file.filename.lower().endswith(".csv")
        or file.filename.lower().endswith(".xlsx")
    ):
        notification = Notification(
            user_id=current_user.id,
            message=f"Dataset upload failed. Invalid file type: {file.filename}",
            type="error",
        )

        db.add(notification)

        log_activity(
            db=db,
            user_id=current_user.id,
            action="DATASET_UPLOAD_FAILED",
            description=f"Invalid file type: {file.filename}",
            module="Datasets",
        )

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are allowed",
        )

    extension = file.filename.split(".")[-1].lower()
    unique_filename = f"{uuid.uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        contents = await file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        if extension == "csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        if df.empty:
            notification = Notification(
                user_id=current_user.id,
                message=f"Dataset upload failed. Empty file: {file.filename}",
                type="error",
            )

            db.add(notification)

            log_activity(
                db=db,
                user_id=current_user.id,
                action="DATASET_UPLOAD_FAILED",
                description=f"Empty dataset: {file.filename}",
                module="Datasets",
            )

            db.commit()

            raise HTTPException(
                status_code=400,
                detail="Uploaded dataset is empty",
            )

        dataset = Dataset(
            filename=unique_filename,
            original_filename=file.filename,
            rows_count=len(df),
            columns_count=len(df.columns),
            user_id=current_user.id,
        )

        db.add(dataset)
        db.flush()

        if project_id is not None:
            project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
            if not project:
                raise HTTPException(
                    status_code=404,
                    detail="Project not found",
                )

            member = db.query(ProjectMember).filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == current_user.id,
            ).first()

            if (
                current_user.id != project.owner_id
                and member is None
                and not project.is_public
            ):
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to attach datasets to this project",
                )

            project_dataset = ProjectDataset(
                project_id=project_id,
                dataset_id=dataset.id,
            )
            db.add(project_dataset)
            project.total_datasets = (project.total_datasets or 0) + 1

        notification = Notification(
            user_id=current_user.id,
            message=f"Dataset '{file.filename}' uploaded successfully",
            type="success",
        )

        db.add(notification)

        log_activity(
            db=db,
            user_id=current_user.id,
            action="DATASET_UPLOAD",
            description=f"Uploaded dataset {file.filename}",
            module="Datasets",
        )

        db.commit()
        db.refresh(dataset)
        clear_cache()

        return {
            "message": "Dataset uploaded successfully",
            "dataset_id": dataset.id,
            "id": dataset.id,
            "file_name": dataset.original_filename,
            "original_filename": dataset.original_filename,
            "rows": dataset.rows_count,
            "rows_count": dataset.rows_count,
            "columns": df.columns.tolist(),
            "columns_count": dataset.columns_count,
            "uploaded_at": dataset.upload_date,
        }

    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)

        notification = Notification(
            user_id=current_user.id,
            message=f"Dataset upload failed for '{file.filename}'",
            type="error",
        )

        db.add(notification)

        log_activity(
            db=db,
            user_id=current_user.id,
            action="DATASET_UPLOAD_FAILED",
            description=f"Upload failed for {file.filename}",
            module="Datasets",
        )

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Dataset upload failed: {str(e)}",
        )


@router.get("/my-datasets")
def get_my_datasets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .order_by(Dataset.upload_date.desc())
        .all()
    )

    return [
        {
            "id": dataset.id,
            "file_name": dataset.original_filename,
            "original_filename": dataset.original_filename,
            "rows_count": dataset.rows_count,
            "columns_count": dataset.columns_count,
            "uploaded_at": dataset.upload_date,
        }
        for dataset in datasets
    ]


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: int,
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

    return {
        "id": dataset.id,
        "file_name": dataset.original_filename,
        "original_filename": dataset.original_filename,
        "rows_count": dataset.rows_count,
        "columns_count": dataset.columns_count,
        "uploaded_at": dataset.upload_date,
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
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

    file_name = dataset.original_filename
    file_path = os.path.join(UPLOAD_DIR, dataset.filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    notification = Notification(
        user_id=current_user.id,
        message=f"Dataset '{file_name}' deleted successfully",
        type="warning",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DATASET_DELETE",
        description=f"Deleted dataset {file_name}",
        module="Datasets",
    )

    db.delete(dataset)
    db.commit()
    clear_cache()

    return {
        "message": "Dataset deleted successfully",
    }