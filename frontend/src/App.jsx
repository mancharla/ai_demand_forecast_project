import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Forecast from "./pages/Forecast";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import Phase4 from "./pages/Phase4";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ScenarioPlanningPage from "./pages/ScenarioPlanningPage";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import AIInsightsPage from "./pages/AIInsightsPage";
import { Toaster } from "react-hot-toast";
import ExecutiveReportsPage from "./pages/ExecutiveReportsPage";
import ModelPerformancePage from "./pages/ModelPerformancePage";
import DatasetVersionsPage from "./pages/DatasetVersionsPage";
import ForecastCollaborationPage from "./pages/ForecastCollaborationPage";
import DashboardCustomizationPage from "./pages/DashboardCustomizationPage";
import ForecastSchedulesPage from "./pages/ForecastSchedulesPage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";
import InteractiveDashboardPage from "./pages/InteractiveDashboardPage";
import ReportSharingPage from "./pages/ReportSharingPage";
import BusinessHealthPage from "./pages/BusinessHealthPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import OrganizationDetailPage from "./pages/OrganizationDetailPage";
import ForecastApprovalsPage from "./pages/ForecastApprovalsPage";
import WorkflowAutomationPage from "./pages/WorkflowAutomationPage";
import StrategicPlanningPage from "./pages/StrategicPlanningPage";
import ForecastGovernancePage from "./pages/ForecastGovernancePage";
import KPIManagementPage from "./pages/KPIManagementPage";
import DataQualityPage from "./pages/DataQualityPage";
import ExecutiveCommandCenterPage from "./pages/ExecutiveCommandCenterPage";
import NotificationCenterPage from "./pages/NotificationCenterPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import EnterpriseDashboardPage from "./pages/EnterpriseDashboardPage";
import OrganizationSettingsPage from "./pages/OrganizationSettingsPage";
import KPITrendPage from "./pages/KPITrendPage";
import KPIReportPage from "./pages/KPIReportPage";
import DataQualityReportPage from "./pages/DataQualityReportPage";
import ProjectOverviewPage from "./pages/ProjectOverviewPage";
function App() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAuthenticated = !!token;
  const isAdmin =
  user?.role === "super_admin" ||
  user?.role === "admin";

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  return (
    
    <BrowserRouter>
    <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />
        
        <Route
          path="/ai-recommendations"
          element={
            <ProtectedRoute>
              <Phase4 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-insights/:projectId"
          element={<AIInsightsPage />}
        />   
         <Route
          path="/executive-reports/:projectId"
          element={<ExecutiveReportsPage />}
        /><Route
          path="/model-performance/:projectId"
          element={<ModelPerformancePage />}
        />
        <Route
          path="/dataset-versions/:projectId"
          element={<DatasetVersionsPage />}
        />
        <Route
          path="/forecast-collaboration/:projectId"
          element={<ForecastCollaborationPage />}
        />
        <Route
          path="/dashboard-customization/:projectId"
          element={<DashboardCustomizationPage />}
        />
        <Route
          path="/forecast-schedules/:projectId"
          element={<ForecastSchedulesPage />}
        />
        <Route
          path="/activity-timeline/:projectId"
          element={<ActivityTimelinePage />}
        />
        <Route
          path="/interactive-dashboard/:projectId"
          element={<InteractiveDashboardPage />}
        />
        <Route path="/kpi-reports" element={<KPIReportPage />} />
        <Route path="/report-sharing" element={<ReportSharingPage />} />
        <Route
          path="/data-quality-reports"
          element={<DataQualityReportPage />}
        />
        <Route
            path="/business-health/:projectId"
            element={<BusinessHealthPage />}
          />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route
              path="/project-overview"
              element={<ProjectOverviewPage />}
            />
          <Route
              path="/organizations/:organizationId/settings"
              element={
                <ProtectedRoute>
                  <OrganizationSettingsPage />
                </ProtectedRoute>
              }
            />

          <Route
              path="/organizations/:organizationId"
              element={
                <ProtectedRoute>
                  <OrganizationDetailPage />
                </ProtectedRoute>
              }
            />
          <Route
            path="/forecast-approvals"
            element={<ForecastApprovalsPage />}
          />
          <Route
            path="/workflow-automation"
            element={<WorkflowAutomationPage />}
          />
          <Route
            path="/strategic-planning"
            element={<StrategicPlanningPage />}
          />
          <Route
            path="/forecast-governance"
            element={<ForecastGovernancePage />}
          />
          <Route path="/kpi-management" element={<KPIManagementPage />} />
          <Route
            path="/data-quality"
            element={<DataQualityPage />}
          />
          <Route
            path="/executive-command-center"
            element={<ExecutiveCommandCenterPage />}
          />
          <Route
            path="/notification-center"
            element={<NotificationCenterPage />}
          />
          <Route
            path="/audit-logs"
            element={<AuditLogsPage />}
          />
          <Route
            path="/enterprise-dashboard"
            element={<EnterpriseDashboardPage />}
          />
          <Route path="/kpi-trends" element={<KPITrendPage />} />
          


        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forecast"
          element={
            <ProtectedRoute>
              <Forecast />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/executive-dashboard"
          element={
            <ProtectedRoute>
              <ExecutiveDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecast-approvals"
          element={
            <ProtectedRoute>
              <ForecastApprovalsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/scenarios"
          element={
            <ProtectedRoute>
              <ScenarioPlanningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;