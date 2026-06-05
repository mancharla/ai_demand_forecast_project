# Advanced AI Demand Forecasting - Phase 1 & 2 Implementation Guide

## Overview

This document outlines the implementation of **Phase 1: Forecast Workspace Management** and **Phase 2: Advanced Scenario Planning** for the Advanced AI Demand Forecasting platform.

---

## Phase 1: Forecast Workspace Management

### Features Implemented

#### 1. Forecast Projects/Workspaces
- Create and manage forecasting workspaces
- Organize datasets, forecasts, and reports under projects
- Project metadata: name, description, color tags, public/private access
- Activity tracking per project

#### 2. Team Management & Permissions
- Add team members to projects
- Role-based access control: owner, editor, viewer, analyst
- Fine-grained permissions: can_edit, can_delete, can_share, can_export, can_collaborate
- Member activity tracking

#### 3. Collaboration Features
- Comment threads on forecasts
- Project activity timeline
- Forecast revision history
- Real-time collaboration metadata

#### 4. Project Organization
- Link datasets to projects
- Organize forecasts by project
- Project-specific activity logs
- Quick access to project resources

### Backend API Endpoints

#### Project Management
```
POST   /projects/                          # Create new project
GET    /projects/                          # List all projects (user's)
GET    /projects/{project_id}              # Get project details
PUT    /projects/{project_id}              # Update project
DELETE /projects/{project_id}              # Delete project
POST   /projects/{project_id}/archive      # Archive project
```

#### Team Management
```
POST   /projects/{project_id}/members                    # Add team member
GET    /projects/{project_id}/members                    # List members
PUT    /projects/{project_id}/members/{user_id}         # Update member role
DELETE /projects/{project_id}/members/{user_id}         # Remove member
```

#### Activity & Collaboration
```
GET    /projects/{project_id}/activity              # Get activity timeline
POST   /projects/{project_id}/comments               # Add comment
GET    /projects/{project_id}/comments               # Get comments
```

### Database Models

#### `ForecastProject`
- Project metadata and organization
- Owner and member relationships
- Activity tracking

#### `ProjectMember`
- Team members and roles
- Permission flags
- Join timestamp

#### `ProjectActivity`
- Audit log of all actions
- Tracks changes with diff metadata

#### `ForecastComment`
- Threaded comment system
- User collaboration

#### `ForecastRevision`
- Forecast version history
- Change tracking

### Frontend Pages

#### `ProjectsPage` (`/projects`)
- List all projects
- Create new project modal
- Quick actions (members, archive, delete)
- Project cards with color tags
- Statistics (datasets, forecasts, members)

#### `ProjectDetailPage` (`/projects/{projectId}`)
- Project overview dashboard
- Tabbed interface:
  - Overview: Quick stats and actions
  - Team: Member management
  - Datasets: Project datasets
  - Scenarios: What-If scenarios
  - Activity: Event timeline
  - Settings: Project configuration

### Usage Example

#### Create a Project
```bash
curl -X POST http://localhost:8000/projects/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 Demand Forecast",
    "description": "Q4 2024 forecasting project",
    "is_public": false,
    "color_tag": "blue"
  }'
```

#### Add Team Member
```bash
curl -X POST http://localhost:8000/projects/1/members \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role": "editor",
    "can_edit": true,
    "can_delete": false,
    "can_share": true,
    "can_export": true
  }'
```

---

## Phase 2: Advanced Scenario Planning (What-If Analysis)

### Features Implemented

#### 1. Scenario Management
- Create custom forecast scenarios
- Predefined scenario templates (optimistic, pessimistic, conservative, aggressive)
- Scenario publishing for team access
- Scenario cloning for variations

#### 2. Variable Modification
Modifiable variables include:
- **sales_growth**: Percentage increase/decrease in sales (%)
- **seasonality**: Seasonal adjustment factor (0.8 - 1.2)
- **demand_elasticity**: Price sensitivity (-2.0 to 0.0)
- **market_share**: Market share change (%)
- **competition_impact**: Competitive pressure factor (0.0 - 1.0)
- **price_change**: Price adjustment (%)

#### 3. Forecast Generation
- Generate modified forecasts based on scenario variables
- Automatic KPI impact calculation
- Product-level and aggregate metrics
- Change percentage tracking

#### 4. Scenario Analysis
- Side-by-side scenario comparison
- Sensitivity analysis on variables
- Scenario templates: optimistic, pessimistic, conservative, aggressive, price scenarios

#### 5. Publishing & Collaboration
- Publish scenarios for team access
- Clone scenarios for variations
- Share scenario results

### Backend API Endpoints

#### Scenario Management
```
POST   /projects/{project_id}/scenarios                              # Create scenario
GET    /projects/{project_id}/scenarios                              # List scenarios
GET    /projects/{project_id}/scenarios/{scenario_id}                # Get scenario details
PUT    /projects/{project_id}/scenarios/{scenario_id}                # Update scenario
DELETE /projects/{project_id}/scenarios/{scenario_id}                # Delete scenario
```

#### Scenario Analysis
```
POST   /projects/{project_id}/scenarios/{scenario_id}/generate-forecast      # Generate forecast
POST   /projects/{project_id}/scenarios/compare                              # Compare scenarios
POST   /projects/{project_id}/scenarios/sensitivity-analysis                 # Sensitivity analysis
```

#### Templates & Publishing
```
GET    /projects/templates/predefined-scenarios                      # Get templates
POST   /projects/{project_id}/scenarios/create-from-template         # Create from template
POST   /projects/{project_id}/scenarios/{scenario_id}/publish        # Publish scenario
POST   /projects/{project_id}/scenarios/{scenario_id}/clone          # Clone scenario
```

### Database Models

#### `ForecastScenario`
- Scenario metadata
- Variable configurations (JSON)
- Forecast results and KPI impact
- Publication status

### Frontend Pages

#### `ScenarioPlanningPage` (`/projects/{projectId}/scenarios`)
- Scenario list and selection
- Base forecast selection
- Scenario creation with variables
- Template library with predefined scenarios
- Forecast generation and results display
- KPI impact visualization
- Comparison charts (original vs modified sales)

### Predefined Scenario Templates

#### Optimistic Growth
```json
{
  "sales_growth": 15,
  "seasonality": 1.1,
  "market_share": 5,
  "competition_impact": 0.05
}
```

#### Pessimistic Decline
```json
{
  "sales_growth": -15,
  "seasonality": 0.9,
  "market_share": -5,
  "competition_impact": 0.15
}
```

#### Price Increase Scenario
```json
{
  "price_change": 10,
  "demand_elasticity": -0.8,
  "market_share": 2
}
```

#### Price Decrease Scenario
```json
{
  "price_change": -10,
  "demand_elasticity": -1.2,
  "market_share": 5
}
```

### Scenario Generation Algorithm

The scenario planning service modifies base forecast data using:

1. **Sales Growth**: `sales *= (1 + sales_growth/100)`
2. **Seasonality**: `sales *= seasonality_factor`
3. **Demand Elasticity**: `sales *= (1 + elasticity * price_change/100)`
4. **Market Share**: `sales *= (1 + market_share/100)`
5. **Competition**: `sales *= (1 - competition_impact)`

### Usage Example

#### Create Scenario
```bash
curl -X POST http://localhost:8000/projects/1/scenarios \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aggressive Growth Scenario",
    "description": "Optimistic market conditions",
    "scenario_type": "custom",
    "variables": {
      "sales_growth": 20,
      "seasonality": 1.15,
      "market_share": 8,
      "competition_impact": 0.08
    }
  }'
```

#### Generate Forecast
```bash
curl -X POST "http://localhost:8000/projects/1/scenarios/1/generate-forecast?base_forecast_id=5" \
  -H "Authorization: Bearer {token}"
```

#### Compare Scenarios
```bash
curl -X POST "http://localhost:8000/projects/1/scenarios/compare?scenario_ids=1&scenario_ids=2&scenario_ids=3" \
  -H "Authorization: Bearer {token}"
```

---

## Installation & Setup

### Backend Setup

1. **Add Extended Models to Database**
```bash
# Models are automatically created on app startup
# Make sure to run migrations if needed
```

2. **Register New Routes** (Already done in main.py)
```python
from app.routers.workspaces import router as workspaces_router
from app.routers.scenarios import router as scenarios_router

app.include_router(workspaces_router)
app.include_router(scenarios_router)
```

3. **Restart Backend**
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup

1. **Add Routes to React Router**
```jsx
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ScenarioPlanningPage from "./pages/ScenarioPlanningPage";

// Add to your router configuration:
<Route path="/projects" element={<ProjectsPage />} />
<Route path="/projects/:projectId" element={<ProjectDetailPage />} />
<Route path="/projects/:projectId/scenarios" element={<ScenarioPlanningPage />} />
```

2. **Add Navigation Links**
```jsx
// In your navigation component
<Link to="/projects">Workspaces</Link>
```

3. **Restart Frontend**
```bash
cd frontend
npm run dev
```

---

## Remaining Phases (Roadmap)

### Phase 3: Business Intelligence Module
- Executive Dashboard with KPIs
- Revenue Forecasting
- Profit Forecasting
- Cost Analysis Dashboard
- Business Performance Metrics

### Phase 4: AI Insights Engine
- Automated business recommendations
- Demand opportunity identification
- Declining product detection
- High-growth product highlighting
- AI-generated summaries

### Phase 5: Forecast Collaboration
- Enhanced comments (mentions, reactions)
- Report sharing and distribution
- Team collaboration workflows
- Activity timelines
- Revision history

### Phase 6: Data Management
- Dataset versioning
- Upload history tracking
- Dataset modifications tracking
- Archive functionality
- Dataset comparison

### Phase 7: Model Performance Dashboard
- Model accuracy trends
- Historical performance comparison
- Model improvement tracking
- Evaluation reports

### Phase 8: Executive Reporting
- Executive summary reports
- Monthly business forecasts
- Revenue/demand outlook
- Management analytics
- Report scheduling

### Phase 9: Dashboard Enhancements
- Customizable widgets
- Dashboard layout saving
- Drill-down analytics
- Cross-filtering
- Navigation improvements

### Phase 10: Performance & Backend
- Modular forecasting services
- Query performance optimization
- API response standardization
- Reporting API enhancements

---

## Testing

### Backend Testing
```bash
# Test project creation
curl -X POST http://localhost:8000/projects/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Testing","is_public":false,"color_tag":"blue"}'

# Test scenario creation
curl -X POST http://localhost:8000/projects/1/scenarios \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Scenario","description":"Test","scenario_type":"custom","variables":{"sales_growth":10}}'
```

### Frontend Testing
1. Navigate to `/projects` - should see Projects page
2. Click "New Project" - modal should appear
3. Create a project
4. Click on project card - should see detail page
5. Navigate to "Scenarios" tab
6. Create or use template scenarios

---

## Architecture Notes

### Models & Relationships
- `ForecastProject` is the root aggregator
- Projects contain `ProjectMembers` for team access
- Projects link to `DatasetVersion`, `Scenario`, and `Comments`
- Activity is tracked via `ProjectActivity`

### Service Layer
- `ScenarioPlanningService` handles forecast modifications
- All business logic separated from routes
- Reusable methods for scenario operations

### Permission Model
- Owner: Full control
- Editor: Can create and edit content
- Viewer: Read-only access
- Specific permission flags for granular control

### API Response Format
All responses follow standard format:
```json
{
  "id": 1,
  "created_at": "2024-06-01T10:00:00",
  "updated_at": "2024-06-01T10:00:00",
  ...
}
```

---

## Performance Considerations

### Database Optimization
- Index on project_id for activity queries
- Index on creator_id for user's scenarios
- Consider pagination for large activity logs

### API Optimization
- Batch API calls for comparing scenarios
- Cache predefined scenario templates
- Implement query result caching

### Frontend Optimization
- Lazy load project members
- Virtualize long activity lists
- Cache scenario data locally

---

## Security

### Role-Based Access Control
- Verify user is project member/owner before operations
- Check permission flags for create/edit/delete
- Audit all changes via activity log

### Data Protection
- Sensitive data (API keys, passwords) should be encrypted
- Use SSL/TLS for all API calls
- Implement rate limiting on sensitive endpoints

### Audit Trail
- All project changes logged
- User attribution for all actions
- Timestamp all activities

---

## Future Enhancements

1. **Real-time Collaboration**: WebSocket for live updates
2. **Advanced Analytics**: Predictive analytics on scenarios
3. **Mobile App**: Native mobile for scenario planning
4. **API Webhooks**: Notify external systems of project changes
5. **Export Capabilities**: Export scenarios as Excel/PDF
6. **Integration APIs**: Connect to ERP, CRM systems
7. **Custom Rules**: User-defined scenario rules
8. **Forecasting Ensemble**: Combine multiple models

---

## Support & Troubleshooting

### Common Issues

**Issue**: Project not showing in list
- **Solution**: Verify user is owner or member

**Issue**: Scenario forecast generation fails
- **Solution**: Ensure base forecast is selected and valid

**Issue**: Team member not able to edit
- **Solution**: Check member role and permission flags

### Debug Mode
Enable logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Files Created/Modified

### New Files
- `/backend/app/models_extended.py` - Extended database models
- `/backend/app/schemas_extended.py` - Pydantic schemas
- `/backend/app/routers/workspaces.py` - Project management routes
- `/backend/app/routers/scenarios.py` - Scenario planning routes
- `/backend/app/services/scenario_planning.py` - Scenario service
- `/frontend/src/pages/ProjectsPage.jsx` - Projects list UI
- `/frontend/src/pages/ProjectDetailPage.jsx` - Project detail UI
- `/frontend/src/pages/ScenarioPlanningPage.jsx` - Scenario planning UI

### Modified Files
- `/backend/app/main.py` - Register new routes and models

---

**Last Updated**: June 2024
**Phase Status**: Phase 1 & 2 Complete
**Next Phase**: Phase 3 - Business Intelligence Module
