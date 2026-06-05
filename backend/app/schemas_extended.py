"""
Pydantic schemas for extended models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# =========================
# PROJECT SCHEMAS
# =========================

class ProjectMemberBase(BaseModel):
    user_id: int
    role: str = "viewer"
    can_edit: bool = False
    can_delete: bool = False
    can_share: bool = False
    can_export: bool = False


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberResponse(ProjectMemberBase):
    id: int
    project_id: int
    joined_at: datetime

    class Config:
        from_attributes = True


class ForecastProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    color_tag: str = "blue"
    is_public: bool = False


class ForecastProjectCreate(ForecastProjectBase):
    pass


class ForecastProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color_tag: Optional[str] = None
    is_public: Optional[bool] = None
    is_archived: Optional[bool] = None


class ForecastProjectResponse(ForecastProjectBase):
    id: int
    owner_id: int
    total_datasets: int
    total_forecasts: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    members: List[ProjectMemberResponse] = []

    class Config:
        from_attributes = True


class ForecastProjectDetailResponse(ForecastProjectResponse):
    members: List[ProjectMemberResponse]
    activity_count: int = 0


# =========================
# SCENARIO SCHEMAS
# =========================

class ForecastScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str = "custom"
    variables: Dict[str, Any] = {}


class ForecastScenarioCreate(ForecastScenarioBase):
    pass


class ForecastScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None


class ForecastScenarioResponse(ForecastScenarioBase):
    id: int
    project_id: int
    creator_id: int
    forecast_results: Optional[Dict[str, Any]] = None
    kpi_impact: Optional[Dict[str, Any]] = None
    is_active: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================
# COLLABORATION SCHEMAS
# =========================

class ForecastCommentBase(BaseModel):
    content: str
    comment_type: str = "comment"


class ForecastCommentCreate(ForecastCommentBase):
    forecast_id: Optional[int] = None
    parent_comment_id: Optional[int] = None


class ForecastCommentResponse(ForecastCommentBase):
    id: int
    project_id: int
    forecast_id: Optional[int]
    user_id: int
    is_resolved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectActivityResponse(BaseModel):
    id: int
    project_id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    description: Optional[str]
    changes: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# DATA MANAGEMENT SCHEMAS
# =========================

class DatasetVersionResponse(BaseModel):
    id: int
    dataset_id: int
    version_number: int
    change_description: Optional[str]
    rows_count: int
    columns_count: int
    file_size_mb: float
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# BUSINESS INTELLIGENCE SCHEMAS
# =========================

class BusinessKPIResponse(BaseModel):
    id: int
    project_id: int
    kpi_name: str
    kpi_type: str
    current_value: Optional[float]
    forecast_value: Optional[float]
    target_value: Optional[float]
    variance_percentage: Optional[float]
    trend: str
    unit: Optional[str]
    last_updated: datetime

    class Config:
        from_attributes = True


class AIInsightResponse(BaseModel):
    id: int
    project_id: int
    forecast_id: Optional[int]
    insight_type: str
    title: str
    description: str
    confidence_score: float
    impact_level: str
    recommended_action: Optional[str]
    is_acknowledged: bool
    is_actionable: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutiveReportBase(BaseModel):
    title: str
    report_type: str
    summary: Optional[str] = None
    is_scheduled: bool = False
    schedule_frequency: Optional[str] = None


class ExecutiveReportCreate(ExecutiveReportBase):
    pass


class ExecutiveReportResponse(ExecutiveReportBase):
    id: int
    project_id: int
    created_by: int
    key_findings: Optional[List[str]]
    recommendations: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModelPerformanceResponse(BaseModel):
    id: int
    project_id: int
    forecast_id: Optional[int]
    model_name: str
    mae: Optional[float]
    rmse: Optional[float]
    mape: Optional[float]
    r2_score: Optional[float]
    accuracy: Optional[float]
    is_best_model: bool
    rank: Optional[int]
    evaluation_date: datetime

    class Config:
        from_attributes = True


class DashboardLayoutResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int]
    layout_name: str
    is_default: bool
    widgets: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
