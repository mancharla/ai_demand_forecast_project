# Advanced AI Demand Forecasting - Developer Quick Start Guide

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- Git
- Docker (optional)

### Initial Setup

#### 1. Clone & Navigate
```bash
git clone <repository-url>
cd "AI advanced demand forecasting/ai-demand-forecasting"
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload
# Server runs at: http://localhost:8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs at: http://localhost:5173
```

#### 4. Database
- Database file: `backend/sqlite.db`
- Auto-creates tables on first run
- Reset: Delete `sqlite.db` and restart server

---

## Project Structure

```
ai-demand-forecasting/
├── backend/
│   ├── app/
│   │   ├── models.py              # Original models
│   │   ├── models_extended.py     # New Phase 1&2 models ✨
│   │   ├── schemas.py             # Original schemas
│   │   ├── schemas_extended.py    # New Phase 1&2 schemas ✨
│   │   ├── main.py                # FastAPI app
│   │   ├── database.py            # DB config
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── forecast.py
│   │   │   ├── dashboard.py
│   │   │   ├── workspaces.py      # NEW - Phase 1 ✨
│   │   │   ├── scenarios.py       # NEW - Phase 2 ✨
│   │   │   └── ... (other routers)
│   │   ├── services/
│   │   │   ├── forecasting.py
│   │   │   ├── scenario_planning.py  # NEW - Phase 2 ✨
│   │   │   └── ... (other services)
│   │   └── utils/
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Forecast.jsx
│   │   │   ├── ProjectsPage.jsx        # NEW - Phase 1 ✨
│   │   │   ├── ProjectDetailPage.jsx   # NEW - Phase 1 ✨
│   │   │   ├── ScenarioPlanningPage.jsx # NEW - Phase 2 ✨
│   │   │   └── ... (other pages)
│   │   ├── components/
│   │   ├── context/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
├── IMPLEMENTATION_GUIDE.md      # NEW Phase 1&2 docs ✨
├── DEVELOPMENT_ROADMAP.md       # NEW Roadmap ✨
└── README.md
```

---

## Common Development Tasks

### Adding a New Feature

#### 1. Backend Model
```python
# Add to models_extended.py
class MyFeature(Base):
    __tablename__ = "my_features"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("forecast_projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ForecastProject", backref="my_features")
```

#### 2. Schema
```python
# Add to schemas_extended.py
class MyFeatureCreate(BaseModel):
    name: str

class MyFeatureResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### 3. Service
```python
# Create app/services/my_service.py
class MyFeatureService:
    @staticmethod
    def create_feature(name: str, project_id: int, db: Session):
        feature = MyFeature(name=name, project_id=project_id)
        db.add(feature)
        db.commit()
        return feature
```

#### 4. Routes
```python
# Create app/routers/my_feature.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/my-feature", tags=["my-feature"])

@router.post("/")
def create_feature(data: MyFeatureCreate, db: Session = Depends(get_db)):
    return MyFeatureService.create_feature(data.name, db)

@router.get("/")
def list_features(db: Session = Depends(get_db)):
    return db.query(MyFeature).all()
```

#### 5. Register Route
```python
# Add to app/main.py
from app.routers.my_feature import router as my_feature_router
from app.models_extended import MyFeature

# Add in imports
# Add in router registration
app.include_router(my_feature_router)
```

#### 6. Frontend Page
```jsx
// Create src/pages/MyFeaturePage.jsx
import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function MyFeaturePage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchFeatures();
  }, []);
  
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await API.get("/my-feature/");
      setFeatures(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageLayout>
      <h1>My Feature</h1>
      {/* UI here */}
    </PageLayout>
  );
}

export default MyFeaturePage;
```

---

## Working with Phase 3: Executive Dashboard (NEXT)

### Key Files to Create

```
Backend:
├── models_extended.py          # Add BusinessKPI, ExecutiveReport
├── schemas_extended.py         # Add KPI schemas
├── services/executive_analytics.py  # NEW
└── routers/executive_dashboard.py   # NEW

Frontend:
├── pages/ExecutiveDashboard.jsx  # NEW
├── pages/BusinessIntelligence.jsx # NEW
└── components/
    ├── KPICard.jsx           # NEW
    ├── RevenueChart.jsx      # NEW
    ├── ProfitAnalysis.jsx    # NEW
    └── CostBreakdown.jsx     # NEW
```

### Implementation Steps

1. **Create Models**
   - Add `BusinessKPI` model
   - Add `ExecutiveReport` model (if not present)
   - Add relationships to projects

2. **Create Service**
   - Implement `calculate_revenue_forecast()`
   - Implement `calculate_profit_forecast()`
   - Implement `calculate_kpi_metrics()`

3. **Create Routes**
   - GET `/executive-dashboard/{project_id}`
   - GET `/executive-dashboard/{project_id}/revenue-forecast`
   - GET `/executive-dashboard/{project_id}/profit-analysis`

4. **Create Frontend**
   - Create ExecutiveDashboard component
   - Add KPI cards
   - Add charts using Recharts

---

## API Testing

### Using curl
```bash
# Create project
curl -X POST http://localhost:8000/projects/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"","is_public":false,"color_tag":"blue"}'

# List projects
curl -X GET http://localhost:8000/projects/ \
  -H "Authorization: Bearer {token}"

# Create scenario
curl -X POST http://localhost:8000/projects/1/scenarios \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Scenario","scenario_type":"custom","variables":{"sales_growth":10}}'
```

### Using Postman/Insomnia
1. Set base URL: `http://localhost:8000`
2. Set authorization header with token
3. Create requests for each endpoint

---

## Database Management

### Viewing Database
```python
# In Python shell
from app.database import SessionLocal
from app.models_extended import ForecastProject

db = SessionLocal()
projects = db.query(ForecastProject).all()
print(projects)
db.close()
```

### Resetting Database
```bash
# Stop server
# Delete backend/sqlite.db
# Restart server - tables will be recreated
```

### Backup Database
```bash
cp backend/sqlite.db backend/sqlite.db.backup
```

---

## Debugging

### Enable Debug Logging
```python
# Add to app/main.py top
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("app")

# Use in routes
logger.debug(f"Processing project: {project_id}")
```

### Check Routes
```bash
# Get all registered routes
curl http://localhost:8000/docs
# Swagger UI with all endpoints
```

### Check Database Tables
```python
from app.database import Base
from sqlalchemy import inspect

inspector = inspect(Base.metadata.bind)
tables = inspector.get_table_names()
print(tables)
```

---

## Common Issues & Solutions

### Issue: "Relationship not found"
**Solution**: Ensure model has `relationship()` defined and foreign key exists

### Issue: "Module not found"
**Solution**: 
```python
# Make sure __init__.py exists in directory
# Update imports in main.py
```

### Issue: CORS errors
**Solution**: Check main.py CORS origins, add `http://localhost:5173` if missing

### Issue: Database locked
**Solution**: 
- Only one process should access DB
- Close all connections before reset
- Restart backend

### Issue: Token invalid
**Solution**:
- Get new token from login endpoint
- Check SECRET_KEY in config.py
- Verify token format: `Bearer {token}`

---

## Frontend Components Best Practices

### Structure
```jsx
import React, { useEffect, useState } from "react";
import API from "../api/axios";
import PageLayout from "../components/PageLayout";

function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/endpoint");
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageLayout>
      {error && <div className="bg-red-50 p-4">{error}</div>}
      {loading && <div>Loading...</div>}
      {/* Content here */}
    </PageLayout>
  );
}

export default MyPage;
```

### Styling
- Use Tailwind classes
- Follow existing color scheme
- Responsive grid: `grid md:grid-cols-2 lg:grid-cols-3`
- Hover effects for interactivity

### Charts
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={400}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="value" fill="#2563eb" />
  </BarChart>
</ResponsiveContainer>
```

---

## Performance Tips

### Backend
- Use indexed queries for frequently accessed fields
- Paginate large result sets
- Cache expensive calculations
- Use lazy loading for relationships

### Frontend
- Use React.memo for expensive components
- Implement pagination for large lists
- Cache API responses
- Optimize re-renders

### Database
- Create indexes on foreign keys
- Add composite indexes for common queries
- Monitor slow queries

---

## Code Standards

### Python
```python
# Follow PEP 8
# Use type hints
def create_project(name: str, db: Session) -> ForecastProject:
    pass

# Use docstrings
"""
Create a new forecast project.
Args:
    name: Project name
    db: Database session
Returns:
    ForecastProject: Created project
"""
```

### JavaScript/React
```jsx
// Use camelCase
const myFunction = () => {};

// Use const by default
const value = 10;

// Functional components
function MyComponent() {
  return <div>Content</div>;
}
```

---

## Quick Commands

### Backend
```bash
# Format code
black app/

# Check types
mypy app/

# Run tests
pytest

# Install dependencies
pip install -r requirements.txt

# Update requirements
pip freeze > requirements.txt
```

### Frontend
```bash
# Format code
npm run format

# Lint
npm run lint

# Build
npm run build

# Install dependencies
npm install
```

---

## Resources

### Documentation
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Phase 1&2 details
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Complete roadmap
- API Docs: http://localhost:8000/docs (when server running)

### Code Examples
- See existing routers: `/backend/app/routers/`
- See existing pages: `/frontend/src/pages/`
- See existing services: `/backend/app/services/`

### External Resources
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Hooks Guide](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)

---

## Support

### Getting Help
1. Check existing documentation
2. Look at similar implementations
3. Review error messages carefully
4. Check logs and console output
5. Ask team members

### Reporting Issues
- Describe what you were doing
- Share error message
- Provide code snippet
- Include system information

---

## Next Steps

1. **Familiarize yourself** with current codebase (Phase 1&2)
2. **Read** DEVELOPMENT_ROADMAP.md for Phase 3 requirements
3. **Start** with backend models and schemas
4. **Follow** the implementation checklist
5. **Test** thoroughly before moving to next phase

---

**Happy coding!** 🚀

For questions, refer to documentation or ask team members.
