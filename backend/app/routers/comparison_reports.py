import os
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO

from app.database import get_db
from app.models import Dataset, Notification
from app.utils.dependencies import get_current_user
from app.services.real_model_comparison import compare_real_models
from app.services.comparison_report_service import (
    generate_comparison_pdf,
    generate_comparison_excel,
)
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/comparison-report",
    tags=["Comparison Reports"],
)


def load_dataset_file(dataset):
    file_path = os.path.join("uploads", dataset.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found",
        )

    if dataset.filename.endswith(".csv"):
        return pd.read_csv(file_path)

    return pd.read_excel(file_path)


def get_comparison_data(dataset_id, db, current_user):
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

    df = load_dataset_file(dataset)

    result = compare_real_models(df)

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.original_filename,
        "best_model": result["best_model"],
        "models": result["models"],
    }


@router.get("/pdf/{dataset_id}")
def download_comparison_pdf(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comparison_data = get_comparison_data(
        dataset_id,
        db,
        current_user,
    )

    pdf_bytes = generate_comparison_pdf(comparison_data)

    notification = Notification(
        user_id=current_user.id,
        message="Model comparison PDF report generated successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MODEL_COMPARISON_PDF_DOWNLOADED",
        description=f"Downloaded model comparison PDF for dataset {dataset_id}",
        module="Reports",
    )

    db.commit()

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; filename=model_comparison_report.pdf"
            )
        },
    )


@router.get("/excel/{dataset_id}")
def download_comparison_excel(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comparison_data = get_comparison_data(
        dataset_id,
        db,
        current_user,
    )

    excel_bytes = generate_comparison_excel(comparison_data)

    notification = Notification(
        user_id=current_user.id,
        message="Model comparison Excel report generated successfully",
        type="success",
    )

    db.add(notification)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MODEL_COMPARISON_EXCEL_DOWNLOADED",
        description=f"Downloaded model comparison Excel for dataset {dataset_id}",
        module="Reports",
    )

    db.commit()

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; filename=model_comparison_report.xlsx"
            )
        },
    )