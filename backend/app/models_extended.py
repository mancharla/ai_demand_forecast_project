"""
Extended models for Advanced Business Intelligence Features
Includes: Workspaces, Projects, Collaboration, Scenarios, and Insights
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.database import Base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime


# =========================
# WORKSPACE & PROJECT MODELS
# =========================

class ForecastProject(Base):
    """Workspace/Project model for organizing forecasts and datasets"""
    __tablename__ = "forecast_projects"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Metadata
    color_tag = Column(String(20), default="blue")  # For UI categorization
    is_archived = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    
    # Stats
    total_datasets = Column(Integer, default=0)
    total_forecasts = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", backref="owned_projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    datasets = relationship("ProjectDataset", back_populates="project", cascade="all, delete-orphan")
    forecasts = relationship("ProjectForecast", back_populates="project", cascade="all, delete-orphan")
    scenarios = relationship("ForecastScenario", back_populates="project", cascade="all, delete-orphan")
    activity = relationship("ProjectActivity", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ForecastComment", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    """Project team members and permissions"""
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Role: owner, editor, viewer, analyst
    role = Column(String(50), default="viewer")
    
    # Permissions flags
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_share = Column(Boolean, default=False)
    can_export = Column(Boolean, default=False)
    can_collaborate = Column(Boolean, default=True)
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="members")
    user = relationship("User", backref="project_memberships")


class ProjectDataset(Base):
    """Associate datasets with projects"""
    __tablename__ = "project_datasets"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="datasets")
    dataset = relationship("Dataset", backref="project_associations")


class ProjectForecast(Base):
    """Project-level forecast tracking"""
    __tablename__ = "project_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False)
    
    # Metadata
    title = Column(String(255), nullable=False)
    is_baseline = Column(Boolean, default=False)  # Mark as baseline forecast
    
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="forecasts")
    forecast = relationship("Forecast", backref="project_forecasts")


# =========================
# SCENARIO & WHAT-IF ANALYSIS
# =========================

class ForecastScenario(Base):
    """What-if analysis scenarios"""
    __tablename__ = "forecast_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Scenario info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(50), default="custom")  # optimistic/pessimistic/custom
    
    # Variables (stored as JSON)
    variables = Column(JSON, default={})  # {sales_growth: 10, seasonality: 1.2, ...}
    
    # Results
    forecast_results = Column(JSON, nullable=True)  # Forecast output as JSON
    kpi_impact = Column(JSON, nullable=True)  # KPI changes
    
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="scenarios")
    creator = relationship("User", backref="created_scenarios")


# =========================
# COLLABORATION & COMMENTS
# =========================

class ForecastComment(Base):
    """Comments and collaboration on forecasts"""
    __tablename__ = "forecast_comments"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Comment
    content = Column(Text, nullable=False)
    comment_type = Column(String(50), default="comment")  # comment/suggestion/alert
    
    # Threaded comments
    parent_comment_id = Column(Integer, ForeignKey("forecast_comments.id"), nullable=True)
    
    is_resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="comments")
    forecast = relationship("Forecast", backref="comments")
    user = relationship("User", backref="forecast_comments")
    replies = relationship("ForecastComment", remote_side=[id], backref="parent")


class ProjectActivity(Base):
    """Track all activities in a project"""
    __tablename__ = "project_activities"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Activity details
    action = Column(String(100), nullable=False)  # created/updated/deleted/commented/shared
    entity_type = Column(String(50), nullable=False)  # forecast/dataset/scenario
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    
    # Additional metadata
    changes = Column(JSON, nullable=True)  # What changed: {field: old_value -> new_value}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", back_populates="activity")
    user = relationship("User", backref="project_activities")


class ForecastRevision(Base):
    """Track forecast revisions for history"""
    __tablename__ = "forecast_revisions"

    id = Column(Integer, primary_key=True, index=True)
    
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Revision info
    version = Column(Integer, default=1)
    change_description = Column(Text, nullable=True)
    
    # Previous values
    previous_mae = Column(Float, nullable=True)
    previous_rmse = Column(Float, nullable=True)
    previous_mape = Column(Float, nullable=True)
    previous_accuracy = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    forecast = relationship("Forecast", backref="revisions")
    user = relationship("User", backref="forecast_revisions")


# =========================
# DATA MANAGEMENT
# =========================

class DatasetVersion(Base):
    """Dataset version tracking"""
    __tablename__ = "dataset_versions"

    id = Column(Integer, primary_key=True, index=True)
    
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Version info
    version_number = Column(Integer, default=1)
    change_description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    
    # Stats
    rows_count = Column(Integer, default=0)
    columns_count = Column(Integer, default=0)
    file_size_mb = Column(Float, default=0)
    
    is_archived = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship("Dataset", backref="versions")
    user = relationship("User", backref="dataset_versions")


# =========================
# BUSINESS INTELLIGENCE & KPIs
# =========================

class BusinessKPI(Base):
    """Business KPIs and performance metrics"""
    __tablename__ = "business_kpis"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # KPI details
    kpi_name = Column(String(255), nullable=False)
    kpi_type = Column(String(50), nullable=False)  # revenue/profit/cost/growth/efficiency
    
    # Values
    current_value = Column(Float, nullable=True)
    forecast_value = Column(Float, nullable=True)
    target_value = Column(Float, nullable=True)
    previous_value = Column(Float, nullable=True)
    
    # Change metrics
    variance_percentage = Column(Float, nullable=True)
    trend = Column(String(20), default="stable")  # up/down/stable
    
    # Metadata
    unit = Column(String(50), nullable=True)  # ₹/units/percentage
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIInsight(Base):
    """AI-generated insights and recommendations"""
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=True)
    
    # Insight details
    insight_type = Column(String(50), nullable=False)  # opportunity/risk/trend/recommendation
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Impact
    confidence_score = Column(Float, default=0.0)  # 0-1
    impact_level = Column(String(20), default="medium")  # high/medium/low
    
    # Recommendation
    recommended_action = Column(Text, nullable=True)
    
    # Status
    is_acknowledged = Column(Boolean, default=False)
    is_actionable = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", backref="ai_insights")
    forecast = relationship("Forecast", backref="ai_insights")


class ExecutiveReport(Base):
    """Executive-level reports"""
    __tablename__ = "executive_reports"

    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Report info
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # monthly/quarterly/custom
    
    # Content
    summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)  # List of findings
    recommendations = Column(JSON, nullable=True)  # List of recommendations
    
    # Sections
    revenue_forecast = Column(JSON, nullable=True)
    profit_forecast = Column(JSON, nullable=True)
    cost_analysis = Column(JSON, nullable=True)
    kpi_summary = Column(JSON, nullable=True)
    
    # Schedule
    is_scheduled = Column(Boolean, default=False)
    schedule_frequency = Column(String(50), nullable=True)  # weekly/monthly
    next_generation_date = Column(DateTime, nullable=True)
    
    # Distribution
    recipients = Column(JSON, nullable=True)  # List of email recipients
    
    file_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", backref="executive_reports")
    creator = relationship("User", backref="created_executive_reports")


class ModelPerformance(Base):
    __tablename__ = "model_performance"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("forecast_projects.id")
    )

    model_name = Column(String(100))

    mae = Column(Float, default=0)

    rmse = Column(Float, default=0)

    mape = Column(Float, default=0)

    accuracy_score = Column(Float, default=0)

    model_rank = Column(Integer, default=0)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
class DashboardLayout(Base):
    __tablename__ = "dashboard_layouts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("forecast_projects.id"))

    layout_name = Column(String(255))

    is_default = Column(Integer, default=0)

    widgets = Column(JSON)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
class ReportShare(Base):
    __tablename__ = "report_shares"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    report_id = Column(Integer, nullable=False)

    report_type = Column(String(100), default="executive_report")
    recipient_email = Column(String(255), nullable=False)
    share_message = Column(Text, nullable=True)

    is_active = Column(Integer, default=1)
    shared_at = Column(DateTime, default=datetime.utcnow)