from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models import Dataset
from app.models_extended import DataQualityReport
from app.services.data_quality_service import (
    load_dataset_file,
    analyze_data_quality,
)


router = APIRouter(
    prefix="/data-quality",
    tags=["Data Quality Management"],
)


class QualityReportCreate(BaseModel):
    dataset_id: int
    organization_id: int | None = None
    project_id: int | None = None


@router.post("/analyze")
def analyze_dataset_quality(
    payload: QualityReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .filter(Dataset.id == payload.dataset_id)
        .first()
    )

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = load_dataset_file(dataset)
        result = analyze_data_quality(df)

        report = DataQualityReport(
            dataset_id=payload.dataset_id,
            organization_id=payload.organization_id,
            project_id=payload.project_id,
            quality_score=result["quality_score"],
            total_rows=result["total_rows"],
            total_columns=result["total_columns"],
            missing_values=result["missing_values"],
            duplicate_rows=result["duplicate_rows"],
            validation_summary=result["validation_summary"],
            created_by=current_user.id,
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        return {
            "message": "Data quality analysis completed",
            "report": report,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
def get_quality_reports(
    project_id: int | None = None,
    organization_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(DataQualityReport).filter(
        DataQualityReport.created_by == current_user.id
    )

    if project_id:
        query = query.filter(DataQualityReport.project_id == project_id)

    if organization_id:
        query = query.filter(DataQualityReport.organization_id == organization_id)

    return query.order_by(DataQualityReport.created_at.desc()).all()


@router.get("/dashboard")
def data_quality_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reports = (
        db.query(DataQualityReport)
        .filter(DataQualityReport.created_by == current_user.id)
        .all()
    )

    if not reports:
        return {
            "total_reports": 0,
            "average_score": 0,
            "excellent": 0,
            "warning": 0,
            "poor": 0,
        }

    average_score = round(
        sum(r.quality_score or 0 for r in reports) / len(reports),
        2,
    )

    excellent = len([r for r in reports if (r.quality_score or 0) >= 85])
    warning = len([r for r in reports if 60 <= (r.quality_score or 0) < 85])
    poor = len([r for r in reports if (r.quality_score or 0) < 60])

    return {
        "total_reports": len(reports),
        "average_score": average_score,
        "excellent": excellent,
        "warning": warning,
        "poor": poor,
    }


@router.delete("/reports/{report_id}")
def delete_quality_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = (
        db.query(DataQualityReport)
        .filter(
            DataQualityReport.id == report_id,
            DataQualityReport.created_by == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Data quality report deleted"}
@router.get("/report-summary")
def quality_report_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reports = db.query(DataQualityReport).all()

    total = len(reports)

    avg_score = (
        sum(r.quality_score for r in reports) / total
        if total > 0
        else 0
    )

    excellent = len(
        [r for r in reports if r.quality_score >= 90]
    )

    poor = len(
        [r for r in reports if r.quality_score < 60]
    )

    return {
        "total_reports": total,
        "average_score": round(avg_score, 2),
        "excellent_reports": excellent,
        "poor_reports": poor,
    }