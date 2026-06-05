# Integration Checklist - Phase 1 & 2 Frontend Setup

## Overview
This document provides the exact steps to integrate the new Phase 1 & 2 frontend pages into your React application.

**Status**: Backend is ready ✅ | Frontend pages created ✅ | Integration needed ⏳

---

## Step 1: Update React Router Configuration

### Find Your Router File
Look for one of these files in your frontend:
- `src/App.jsx`
- `src/main.jsx`
- `src/Router.jsx`
- `src/routes/index.jsx`

### Add New Routes

#### If using React Router v6 in App.jsx:
```jsx
// Add imports at the top of App.jsx
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ScenarioPlanningPage from "./pages/ScenarioPlanningPage";

// Add routes in your <Routes> component:
<Routes>
  {/* Existing routes... */}
  
  {/* NEW: Phase 1 & 2 Routes */}
  <Route path="/projects" element={<ProjectsPage />} />
  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
  <Route path="/projects/:projectId/scenarios" element={<ScenarioPlanningPage />} />
  
  {/* Rest of routes... */}
</Routes>
```

---

## Step 2: Update Navigation/Menu

### Add Links to Your Navigation Component

#### Find Your Navigation File
- `src/components/Header.jsx`
- `src/components/Navbar.jsx`
- `src/components/Navigation.jsx`
- Or wherever your main navigation is

#### Add Navigation Links
```jsx
import { Link } from "react-router-dom";

function Navigation() {
  return (
    <nav>
      {/* Existing links */}
      
      {/* NEW: Add these links */}
      <Link to="/projects" className="nav-link">
        Workspaces
      </Link>
      
      {/* Or with icons if using Lucide */}
      <Link to="/projects" className="flex items-center gap-2">
        <Folder size={20} />
        <span>Workspaces</span>
      </Link>
    </nav>
  );
}
```

### If Using a Sidebar

```jsx
const menuItems = [
  // Existing items
  {
    label: "Workspaces",
    icon: Folder,
    href: "/projects",
    id: "workspaces"
  },
  // Rest of menu
];
```

---

## Step 3: Verify Authentication/Context

### Check if Auth Context Exists
Your app likely has an auth context. Verify it has:
- User token/authentication state
- Get current user function
- Token storage

### Typical Auth Context Usage
```jsx
import { useAuth } from "../context/AuthContext"; // or your context

function ProjectsPage() {
  const { user, token } = useAuth();
  
  // The pages already handle this internally
  // but verify your context is set up correctly
}
```

---

## Step 4: Verify API Configuration

### Check API Axios Setup
Verify `src/api/axios.js` (or similar) exists and has:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // Your backend URL
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

The new pages use this automatically.

---

## Step 5: Update Imports (If Needed)

### Check These Imports Work
The new pages should already have correct imports. Verify:

```jsx
// In ProjectsPage.jsx, ProjectDetailPage.jsx, ScenarioPlanningPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // These work with React Router
import API from "../api/axios";
import { Plus, Edit, Trash2, Users, /* other icons */ } from "lucide-react";
import { BarChart, Bar, /* other recharts */ } from "recharts";
```

If any imports fail:
1. Verify packages installed: `npm install`
2. Check import paths are correct
3. Use `npm list` to verify installed versions

---

## Step 6: Test Integration

### 1. Start Servers
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Navigate to New Pages
- Go to `http://localhost:5173/projects`
- Should see Projects page
- Try creating a project
- Click on a project

### 3. Check Console for Errors
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab for API calls
- Look for any error messages

### 4. Test Basic Workflows
- Create a project
- Add a team member
- Create a scenario
- Generate forecast

---

## Step 7: Styling & Layout

### If Styling Looks Off
The pages use Tailwind CSS. Make sure:

1. **Tailwind is Installed**
```bash
npm install -D tailwindcss postcss autoprefixer
```

2. **Tailwind Config Exists**
Check `tailwind.config.js` includes your content:
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // ...
}
```

3. **CSS is Imported**
Check `src/main.jsx` or `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Step 8: Optional Enhancements

### Add Icons to Menu
```jsx
import { 
  LayoutGrid,  // For dashboard
  Folder,      // For projects
  TrendingUp,  // For scenarios
  BarChart3,   // For reports
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/" },
  { label: "Workspaces", icon: Folder, href: "/projects" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
];
```

### Add Breadcrumbs
```jsx
import { ChevronRight } from "lucide-react";

function Breadcrumbs({ items }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={16} />}
          <a href={item.href}>{item.label}</a>
        </React.Fragment>
      ))}
    </div>
  );
}
```

### Add Loading Skeleton
```jsx
function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3].map(i => (
        <div key={i} className="bg-gray-200 h-48 rounded animate-pulse" />
      ))}
    </div>
  );
}
```

---

## Step 9: Error Handling

### Common Issues & Solutions

#### Issue: Routes not working
```
Solution: 
1. Check <BrowserRouter> wraps your app in main.jsx
2. Verify path spelling exactly matches
3. Check React Router version (should be v6+)
```

#### Issue: API calls failing
```
Solution:
1. Verify backend is running: http://localhost:8000/docs
2. Check token is being sent: DevTools > Network tab
3. Look for 401 errors (need to login first)
4. Look for CORS errors (check backend CORS config)
```

#### Issue: Styling not applying
```
Solution:
1. Verify Tailwind CSS is set up
2. Check no CSS framework conflicts
3. Inspect element with browser DevTools
4. Check for CSS module conflicts
```

#### Issue: Components not loading
```
Solution:
1. Check import paths are correct (case-sensitive)
2. Verify files exist in pages/ folder
3. Check for circular imports
4. Look at browser console for errors
```

---

## Step 10: Performance Optimization

### Optional Performance Improvements

#### Lazy Load Components
```jsx
import { lazy, Suspense } from "react";

const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));

// In Routes:
<Suspense fallback={<div>Loading...</div>}>
  <Route path="/projects" element={<ProjectsPage />} />
</Suspense>
```

#### Cache API Responses
```jsx
const fetchData = async () => {
  const cached = localStorage.getItem('projects');
  if (cached) return JSON.parse(cached);
  
  const response = await API.get('/projects/');
  localStorage.setItem('projects', JSON.stringify(response.data));
  return response.data;
};
```

#### Memoize Components
```jsx
import { memo } from "react";

const ProjectCard = memo(({ project, onDelete }) => {
  return (
    // Component JSX
  );
});
```

---

## Step 11: Verification Checklist

Run through this checklist to verify integration is complete:

### Files
- [ ] `src/pages/ProjectsPage.jsx` exists
- [ ] `src/pages/ProjectDetailPage.jsx` exists
- [ ] `src/pages/ScenarioPlanningPage.jsx` exists
- [ ] Routes added to main router file
- [ ] Navigation links added

### Functionality
- [ ] Navigation to /projects works
- [ ] ProjectsPage loads without errors
- [ ] Can see projects list (or empty state)
- [ ] Can create a new project
- [ ] Project detail page loads
- [ ] Can view scenarios tab
- [ ] Can create scenarios
- [ ] API calls work (check Network tab)

### Styling
- [ ] Pages look visually complete
- [ ] Colors apply correctly
- [ ] Layout is responsive
- [ ] No console warnings
- [ ] Buttons are clickable

### Error Handling
- [ ] Error messages show correctly
- [ ] Loading states display
- [ ] No unhandled errors in console
- [ ] Can recover from errors

---

## Step 12: First-Time User Setup

### If This is First Time Using New Features

1. **Create a Test Project**
   - Click "New Project"
   - Fill in name, description
   - Click Create

2. **Add Team Members**
   - Go to Project → Team tab
   - Add a team member
   - Set permissions

3. **Create a Dataset**
   - Go to Project → Datasets tab
   - Upload or link a dataset

4. **Create a Forecast**
   - Go to main Forecast page
   - Generate forecast
   - Link to project

5. **Try Scenario Planning**
   - Go to Project → Scenarios tab
   - Create custom scenario or use template
   - Generate forecast with different variables
   - See KPI impact

---

## Troubleshooting

### If Pages Don't Show
```
1. Check console for errors
2. Verify router setup
3. Check component imports
4. Restart npm dev server
```

### If API Calls Fail
```
1. Check backend is running
2. Verify base URL in axios config
3. Check authentication token
4. Look at Network tab in DevTools
5. Check backend logs
```

### If Styling is Wrong
```
1. Verify Tailwind is working
2. Check for CSS conflicts
3. Inspect elements with DevTools
4. Check class names are correct
5. Verify tailwind.config.js
```

### If Routing Doesn't Work
```
1. Check <BrowserRouter> is set up
2. Verify React Router v6+
3. Check path spelling
4. Verify component exports
5. Check for typos in routes
```

---

## Next Steps After Integration

1. **Test Thoroughly**
   - Go through each feature
   - Test with different users
   - Try error cases

2. **Get User Feedback**
   - Show to team members
   - Gather feedback
   - Note improvement areas

3. **Proceed to Phase 3**
   - When ready, start Phase 3: Business Intelligence
   - Follow DEVELOPMENT_ROADMAP.md
   - Use DEVELOPER_GUIDE.md as reference

4. **Monitor Performance**
   - Check API response times
   - Monitor frontend load time
   - Look for console errors
   - Watch database performance

---

## Support Resources

### Documentation
- `IMPLEMENTATION_GUIDE.md` - Feature documentation
- `DEVELOPER_GUIDE.md` - Development reference
- `DEVELOPMENT_ROADMAP.md` - Complete roadmap
- API Docs: `http://localhost:8000/docs`

### Code References
- Check existing routes in `src/pages/`
- Check existing components in `src/components/`
- Check API calls in `src/api/`

### Debugging
- Browser DevTools (F12)
- Redux DevTools (if using Redux)
- Network tab to check API calls
- Console for JavaScript errors
- Backend logs for API errors

---

## Rollback Instructions

If something goes wrong and you need to revert:

```bash
# Restore to previous state
git checkout -- src/App.jsx  # Or your main router file

# Or manually remove:
# 1. Delete the import statements
# 2. Delete the route entries
# 3. Delete the navigation links
# 4. Save and refresh
```

---

## Final Checklist

- [ ] Backend is running and accessible
- [ ] Frontend can connect to backend
- [ ] All routes are added
- [ ] Navigation links added
- [ ] Pages load without errors
- [ ] API calls work
- [ ] Styling looks correct
- [ ] Can create projects
- [ ] Can create scenarios
- [ ] Can generate forecasts
- [ ] No console errors
- [ ] Ready to use new features

---

**Status**: Ready for Integration ✅

Once you complete these steps, **Phase 1 & 2 will be fully operational!**

For questions or issues, refer to the documentation files or check the backend logs and browser console for error messages.

---

**Estimated Time to Complete Integration**: 15-30 minutes

Good luck! 🚀
