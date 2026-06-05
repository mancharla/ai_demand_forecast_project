import API from "./axios";

/* =========================
   ADMIN APIs
========================= */

export const getActivityLogs = (params = {}) => {
  return API.get("/admin/activity-logs", {
    params,
  });
};

export const getSystemMetrics = () => {
  return API.get("/admin/system-metrics");
};
export const getApiActivityLogs = (params = {}) => {
  return API.get("/admin/api-activity-logs", {
    params,
  });
};

/* =========================
   GLOBAL SEARCH
========================= */

export const globalSearch = (q) => {
  return API.get("/search/", {
    params: { q },
  });
};

/* =========================
   DASHBOARD ANALYTICS
========================= */

export const getRegionAnalytics = () => {
  return API.get("/dashboard/region-analytics");
};

export const getCategoryInsights = () => {
  return API.get("/dashboard/category-insights");
};

export const getRevenuePrediction = () => {
  return API.get("/dashboard/revenue-prediction");
};

export const getInventoryRisk = () => {
  return API.get("/dashboard/inventory-risk");
};

export const getAnomalies = () => {
  return API.get("/dashboard/anomalies");
};

export const getSeasonalTrends = () => {
  return API.get("/dashboard/seasonal-trends");
};

export const getBusinessInsights = () => {
  return API.get("/dashboard/business-insights");
};

export const getForecastAnalysis = () => {
  return API.get("/dashboard/forecast-analysis");
};

/* =========================
   REALTIME APIs
========================= */

export const getRealtimeDashboard = () => {
  return API.get("/realtime/dashboard");
};

/* =========================
   REPORTS APIs
========================= */

export const downloadForecastExcel = () => {
  return API.get("/reports/forecast/excel", {
    responseType: "blob",
  });
};

export const downloadDashboardPDF = () => {
  return API.get("/reports/dashboard/pdf", {
    responseType: "blob",
  });
};
export const downloadAnalyticsSummary = () => {
  return API.get(
    "/reports/analytics/summary/excel",
    {
      responseType: "blob",
    }
  );
};
export const getApiPerformanceSummary = () => {
  return API.get("/admin/api-performance-summary");
};
/* =========================
   FORECAST APIs
========================= */

export const getForecastHistory = () => {
  return API.get("/forecast/history/my-history");
};

export const getForecastMetrics = () => {
  return API.get("/forecast/metrics/my-metrics");
};

export const getExecutiveOverview = (projectId) => {
  return API.get(`/executive-dashboard/${projectId}`);
};

export const getExecutiveRevenueForecast = (projectId) => {
  return API.get(`/executive-dashboard/${projectId}/revenue-forecast`);
};

export const getExecutiveProfitAnalysis = (projectId) => {
  return API.get(`/executive-dashboard/${projectId}/profit-analysis`);
};

export const getExecutiveCostAnalysis = (projectId) => {
  return API.get(`/executive-dashboard/${projectId}/cost-analysis`);
};

export const getExecutiveKpiSummary = (projectId) => {
  return API.get(`/executive-dashboard/${projectId}/kpi-summary`);
};

/* =========================
   NOTIFICATION APIs
========================= */

export const getNotifications = () => {
  return API.get("/notifications/");
};

export const markNotificationRead = (id) => {
  return API.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return API.put("/notifications/mark-all/read");
};

export const getRegionDrilldown = (datasetId, region) => {
  return API.get(`/drilldown/region/${datasetId}/${region}`);
};

export const getProductDrilldown = (datasetId, product) => {
  return API.get(`/drilldown/product/${datasetId}/${product}`);
};