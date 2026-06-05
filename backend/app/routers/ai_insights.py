from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models_extended import ForecastProject, ProjectDataset, AIInsight
from app.services.ai_insights_engine import (
    load_project_datasets,
    generate_ai_insights_from_dataframe,
)

router = APIRouter(
    prefix="/ai-insights",
    tags=["AI Insights"],
)


@router.post("/generate/{project_id}")
def generate_project_ai_insights(
    project_id: int,
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

    df = load_project_datasets(project_datasets)

    if df is None:
        raise HTTPException(
            status_code=404,
            detail="No valid datasets found for this project",
        )

    old_insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .all()
    )

    for insight in old_insights:
        db.delete(insight)

    generated_insights = generate_ai_insights_from_dataframe(df)

    saved = []

    for item in generated_insights:
        insight = AIInsight(
            project_id=project_id,
            forecast_id=None,
            insight_type=item["insight_type"],
            title=item["title"],
            description=item["description"],
            confidence_score=item["confidence_score"],
            impact_level=item["impact_level"],
            recommended_action=item["recommended_action"],
            is_acknowledged=False,
            is_actionable=True,
        )

        db.add(insight)
        saved.append(insight)

    db.commit()

    return {
        "message": "AI insights generated successfully",
        "count": len(saved),
    }


@router.get("/project/{project_id}")
def get_project_ai_insights(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(ForecastProject)
        .filter(ForecastProject.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    insights = (
        db.query(AIInsight)
        .filter(AIInsight.project_id == project_id)
        .order_by(AIInsight.created_at.desc())
        .all()
    )

    return insights


@router.put("/{insight_id}/acknowledge")
def acknowledge_ai_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    insight = (
        db.query(AIInsight)
        .filter(AIInsight.id == insight_id)
        .first()
    )

    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.is_acknowledged = True

    db.commit()
    db.refresh(insight)

    return {
        "message": "Insight acknowledged",
        "insight": insight,
    }


@router.delete("/{insight_id}")
def delete_ai_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    insight = (
        db.query(AIInsight)
        .filter(AIInsight.id == insight_id)
        .first()
    )

    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    db.delete(insight)
    db.commit()

    return {"message": "Insight deleted successfully"}