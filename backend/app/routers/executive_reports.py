from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import (
    ForecastProject,
    ProjectDataset,
    ExecutiveReport,
    AIInsight,
)
from app.services.executive_report_generator import (
    load_project_data,
    generate_report_sections,
)

router = APIRouter(
    prefix="/executive-reports",
    tags=["Executive Reports"],
)


@router.post("/generate/{project_id}")
def generate_executive_report(
    project_id: int,
    report_type: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(ForecastProject)
        .filter(
            ForecastProject.id == project_id,
            ForecastProject.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_datasets = (
        db.query(ProjectDataset)
        .filter(
            ProjectDataset.project_id == project_id,
            ProjectDataset.is_active == True,
        )
        .all()
    )

    df = load_project_data(project_datasets)

    if df is None:
        raise HTTPException(
            status_code=404,
            detail="No valid dataset found for this project",
        )

    insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .order_by(AIInsight.created_at.desc())
        .all()
    )

    sections = generate_report_sections(df, insights)

    report = ExecutiveReport(
        project_id=project_id,
        created_by=current_user.id,
        title=f"{project.name} Executive {report_type.title()} Report",
        report_type=report_type,
        summary=sections["summary"],
        key_findings=sections["key_findings"],
        recommendations=sections["recommendations"],
        revenue_forecast=sections["revenue_forecast"],
        profit_forecast=sections["profit_forecast"],
        cost_analysis=sections["cost_analysis"],
        kpi_summary=sections["kpi_summary"],
        is_scheduled=False,
        schedule_frequency=None,
        recipients=[],
        file_path=None,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Executive report generated successfully",
        "report": report,
    }


@router.get("/project/{project_id}")
def get_project_executive_reports(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reports = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.project_id == project_id)
        .order_by(ExecutiveReport.created_at.desc())
        .all()
    )

    return reports


@router.get("/{report_id}")
def get_executive_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.id == report_id)
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.delete("/{report_id}")
def delete_executive_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = (
        db.query(ExecutiveReport)
        .filter(ExecutiveReport.id == report_id)
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Executive report deleted successfully"}