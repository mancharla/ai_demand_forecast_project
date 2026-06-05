"""
API routes for Scenario Planning - What-If Analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple, Optional

from app.database import get_db
from app.models_extended import ForecastScenario, ForecastProject
from app.schemas_extended import (
    ForecastScenarioCreate, ForecastScenarioUpdate, ForecastScenarioResponse
)
from app.utils.dependencies import get_current_user
from app.models import User, Forecast
from app.services.scenario_planning import ScenarioPlanningService

router = APIRouter(prefix="/projects", tags=["scenarios"])


# =========================
# SCENARIO MANAGEMENT
# =========================

@router.post("/{project_id}/scenarios", response_model=ForecastScenarioResponse, status_code=201)
def create_scenario(
    project_id: int,
    scenario: ForecastScenarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new forecast scenario"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_scenario = ScenarioPlanningService.create_scenario(
        project_id=project_id,
        creator_id=current_user.id,
        name=scenario.name,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        variables=scenario.variables,
        db=db
    )
    
    return new_scenario


@router.get("/{project_id}/scenarios", response_model=List[ForecastScenarioResponse])
def list_scenarios(
    project_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List scenarios for a project"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenarios = db.query(ForecastScenario).filter(
        ForecastScenario.project_id == project_id
    ).offset(skip).limit(limit).all()
    
    return scenarios


@router.get("/{project_id}/scenarios/{scenario_id}", response_model=ForecastScenarioResponse)
def get_scenario(
    project_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed scenario information"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return scenario


@router.put("/{project_id}/scenarios/{scenario_id}", response_model=ForecastScenarioResponse)
def update_scenario(
    project_id: int,
    scenario_id: int,
    scenario_update: ForecastScenarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update scenario details"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    if scenario.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can update scenario")
    
    update_data = scenario_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scenario, field, value)
    
    db.commit()
    db.refresh(scenario)
    
    return scenario


@router.delete("/{project_id}/scenarios/{scenario_id}", status_code=204)
def delete_scenario(
    project_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scenario"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    if scenario.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can delete scenario")
    
    db.delete(scenario)
    db.commit()
    
    return None


# =========================
# SCENARIO ANALYSIS & GENERATION
# =========================

@router.post("/{project_id}/scenarios/{scenario_id}/generate-forecast")
def generate_scenario_forecast(
    project_id: int,
    scenario_id: int,
    base_forecast_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate forecast based on scenario variables"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Get base forecast
    base_forecast = db.query(Forecast).filter(Forecast.id == base_forecast_id).first()
    
    if not base_forecast:
        raise HTTPException(status_code=404, detail="Base forecast not found")
    
    try:
        # Parse forecast values (assuming JSON format)
        import json
        base_data = json.loads(base_forecast.forecast_values) if base_forecast.forecast_values else []
        
        # Generate scenario forecast
        result = ScenarioPlanningService.generate_scenario_forecast(
            scenario_id=scenario_id,
            base_forecast_data=base_data,
            variables=scenario.variables,
            db=db
        )
        
        # Save results
        ScenarioPlanningService.save_scenario_results(
            scenario_id=scenario_id,
            forecast_results=result['forecast'],
            kpi_impact=result['kpi_impact'],
            db=db
        )
        
        return {
            'status': 'success',
            'scenario_id': scenario_id,
            'forecast': result['forecast'],
            'kpi_impact': result['kpi_impact'],
            'summary': {
                'total_original_sales': result['total_original_sales'],
                'total_modified_sales': result['total_modified_sales'],
                'total_change_percentage': result['kpi_impact']['total_sales_change_percentage']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecast generation failed: {str(e)}")


@router.post("/{project_id}/scenarios/compare")
def compare_scenarios(
    project_id: int,
    scenario_ids: List[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare multiple scenarios"""
    if len(scenario_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 scenarios to compare")
    
    # Verify all scenarios belong to the project
    scenarios = db.query(ForecastScenario).filter(
        ForecastScenario.id.in_(scenario_ids),
        ForecastScenario.project_id == project_id
    ).all()
    
    if len(scenarios) != len(scenario_ids):
        raise HTTPException(status_code=404, detail="Some scenarios not found")
    
    comparison = ScenarioPlanningService.compare_scenarios(
        scenario_ids=scenario_ids,
        db=db
    )
    
    return comparison


# =========================
# PREDEFINED SCENARIOS
# =========================

@router.get("/templates/predefined-scenarios")
def get_predefined_scenarios():
    """Get predefined scenario templates"""
    return ScenarioPlanningService.get_predefined_scenarios()


@router.post("/{project_id}/scenarios/create-from-template")
def create_from_template(
    project_id: int,
    template_name: str = Query(...),
    scenario_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create scenario from predefined template"""
    project = db.query(ForecastProject).filter(ForecastProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    templates = ScenarioPlanningService.get_predefined_scenarios()
    
    if template_name not in templates:
        raise HTTPException(status_code=400, detail="Invalid template name")
    
    template = templates[template_name]
    
    scenario = ScenarioPlanningService.create_scenario(
        project_id=project_id,
        creator_id=current_user.id,
        name=scenario_name,
        description=template['description'],
        scenario_type=template_name,
        variables=template['variables'],
        db=db
    )
    
    return scenario


# =========================
# SENSITIVITY ANALYSIS
# =========================

@router.post("/{project_id}/scenarios/sensitivity-analysis")
def sensitivity_analysis(
    project_id: int,
    base_forecast_id: int = Query(...),
    variable_name: str = Query(...),
    min_value: float = Query(...),
    max_value: float = Query(...),
    step: float = Query(5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform sensitivity analysis on a variable"""
    base_forecast = db.query(Forecast).filter(Forecast.id == base_forecast_id).first()
    
    if not base_forecast:
        raise HTTPException(status_code=404, detail="Base forecast not found")
    
    try:
        import json
        base_data = json.loads(base_forecast.forecast_values) if base_forecast.forecast_values else []
        
        results = ScenarioPlanningService.analyze_scenario_sensitivity(
            base_forecast=base_data,
            variable_name=variable_name,
            variable_range=(min_value, max_value),
            step=step
        )
        
        return {
            'variable': variable_name,
            'range': {'min': min_value, 'max': max_value},
            'analysis': results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sensitivity analysis failed: {str(e)}")


# =========================
# SCENARIO PUBLISHING & CLONING
# =========================

@router.post("/{project_id}/scenarios/{scenario_id}/publish", response_model=ForecastScenarioResponse)
def publish_scenario(
    project_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish scenario for team access"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    if scenario.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can publish scenario")
    
    published = ScenarioPlanningService.publish_scenario(scenario_id=scenario_id, db=db)
    
    return published


@router.post("/{project_id}/scenarios/{scenario_id}/clone", response_model=ForecastScenarioResponse, status_code=201)
def clone_scenario(
    project_id: int,
    scenario_id: int,
    new_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clone an existing scenario"""
    scenario = db.query(ForecastScenario).filter(
        ForecastScenario.id == scenario_id,
        ForecastScenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    cloned = ScenarioPlanningService.clone_scenario(
        scenario_id=scenario_id,
        new_name=new_name,
        creator_id=current_user.id,
        db=db
    )
    
    return cloned
