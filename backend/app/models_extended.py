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
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))

    is_active = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String(50), default="analyst")  
    # owner / admin / manager / analyst / viewer

    is_active = Column(Integer, default=1)

    joined_at = Column(DateTime, default=datetime.utcnow)


class OrganizationSetting(Base):
    __tablename__ = "organization_settings"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"))

    setting_key = Column(String(150), nullable=False)
    setting_value = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
class ForecastApproval(Base):
    __tablename__ = "forecast_approvals"

    id = Column(Integer, primary_key=True, index=True)

    forecast_id = Column(Integer, ForeignKey("forecasts.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    submitted_by = Column(Integer, ForeignKey("users.id"))
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String(50), default="pending")
    # pending / approved / rejected

    comments = Column(Text, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)


class ForecastApprovalHistory(Base):
    __tablename__ = "forecast_approval_history"

    id = Column(Integer, primary_key=True, index=True)

    approval_id = Column(Integer, ForeignKey("forecast_approvals.id"))
    action_by = Column(Integer, ForeignKey("users.id"))

    action = Column(String(50))
    # submitted / approved / rejected / resubmitted

    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, nullable=True)

    workflow_name = Column(String(150), nullable=False)

    workflow_type = Column(String(100), nullable=False)
    # forecast_generation
    # report_generation
    # notification
    # custom

    trigger_type = Column(String(100), default="manual")
    # manual
    # schedule
    # event

    configuration = Column(JSON, nullable=True)

    is_active = Column(Integer, default=1)

    created_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)


class WorkflowExecutionLog(Base):
    __tablename__ = "workflow_execution_logs"

    id = Column(Integer, primary_key=True, index=True)

    workflow_id = Column(Integer, ForeignKey("workflows.id"))

    execution_status = Column(String(50))
    # success
    # failed

    execution_message = Column(Text, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)

    completed_at = Column(DateTime, nullable=True)

class BusinessTarget(Base):
    __tablename__ = "business_targets"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=True)

    target_name = Column(String(150), nullable=False)
    target_type = Column(String(100), nullable=False)
    # revenue / profit / demand / cost

    target_period = Column(String(50), nullable=False)
    # annual / quarterly / monthly

    target_value = Column(Float, default=0)

    actual_value = Column(Float, default=0)
    forecast_value = Column(Float, default=0)

    status = Column(String(50), default="on_track")
    # on_track / at_risk / missed / achieved

    created_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)


class PlanningRecommendation(Base):
    __tablename__ = "planning_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=True)

    recommendation_type = Column(String(100))
    title = Column(String(200))
    description = Column(Text)
    priority = Column(String(50), default="medium")

    created_at = Column(DateTime, default=datetime.utcnow)
class ForecastGovernanceRecord(Base):
    __tablename__ = "forecast_governance_records"

    id = Column(Integer, primary_key=True, index=True)

    forecast_id = Column(Integer, ForeignKey("forecasts.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    lifecycle_stage = Column(String(100), default="draft")
    # draft / submitted / approved / rejected / archived

    version_number = Column(Integer, default=1)

    change_type = Column(String(100), default="created")
    # created / updated / submitted / approved / rejected / archived

    change_summary = Column(Text, nullable=True)

    changed_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)


class ForecastLifecycleStatus(Base):
    __tablename__ = "forecast_lifecycle_status"

    id = Column(Integer, primary_key=True, index=True)

    forecast_id = Column(Integer, ForeignKey("forecasts.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    current_stage = Column(String(100), default="draft")
    # draft / submitted / approved / rejected / archived

    current_version = Column(Integer, default=1)

    last_action_by = Column(Integer, ForeignKey("users.id"))

    updated_at = Column(DateTime, default=datetime.utcnow)
class CustomKPI(Base):
    __tablename__ = "custom_kpis"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=True)

    kpi_name = Column(String(150), nullable=False)
    kpi_type = Column(String(100), nullable=False)

    target_value = Column(Float, default=0)
    current_value = Column(Float, default=0)

    alert_threshold = Column(Float, default=0)

    created_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)


class KPIPerformanceHistory(Base):
    __tablename__ = "kpi_performance_history"

    id = Column(Integer, primary_key=True, index=True)

    kpi_id = Column(Integer, ForeignKey("custom_kpis.id"))

    metric_value = Column(Float, default=0)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
class DataQualityReport(Base):
    __tablename__ = "data_quality_reports"

    id = Column(Integer, primary_key=True, index=True)

    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("forecast_projects.id"), nullable=True)

    quality_score = Column(Float, default=0)

    total_rows = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    missing_values = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)

    validation_summary = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    email_enabled = Column(Integer, default=0)
    in_app_enabled = Column(Integer, default=1)

    forecast_alerts = Column(Integer, default=1)
    approval_alerts = Column(Integer, default=1)
    report_alerts = Column(Integer, default=1)
    workflow_alerts = Column(Integer, default=1)

    updated_at = Column(DateTime, default=datetime.utcnow)


class OrganizationAnnouncement(Base):
    __tablename__ = "organization_announcements"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    role_target = Column(String(50), default="all")
    # all / admin / manager / analyst / viewer

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    is_active = Column(Integer, default=1)

class OrganizationAuditLog(Base):
    __tablename__ = "organization_audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    module_name = Column(String(150), nullable=False)
    action = Column(String(150), nullable=False)

    description = Column(Text, nullable=True)

    ip_address = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)