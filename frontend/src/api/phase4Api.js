import API from "./axios";



// =========================
// Smart Automation APIs
// =========================
export const createForecastSchedule = (data) => {
  return API.post("/automation/forecast-schedules", data);
};

export const getForecastSchedules = () => {
  return API.get("/automation/forecast-schedules");
};

export const updateForecastSchedule = (id, data) => {
  return API.put(`/automation/forecast-schedules/${id}`, data);
};

export const deleteForecastSchedule = (id) => {
  return API.delete(`/automation/forecast-schedules/${id}`);
};

export const runForecastScheduleNow = (id) => {
  return API.post(`/automation/forecast-schedules/${id}/run-now`);
};


// =========================
// Enterprise Integration APIs
// =========================
export const createIntegration = (data) => {
  return API.post("/integrations/", data);
};

export const getIntegrations = () => {
  return API.get("/integrations/");
};

export const updateIntegration = (id, data) => {
  return API.put(`/integrations/${id}`, data);
};

export const deleteIntegration = (id) => {
  return API.delete(`/integrations/${id}`);
};

export const testIntegration = (id) => {
  return API.post(`/integrations/${id}/test`);
};


// =========================
// Alert APIs
// =========================
export const createAlertSetting = (data) => {
  return API.post("/alerts/settings", data);
};

export const getAlertSettings = () => {
  return API.get("/alerts/settings");
};

export const updateAlertSetting = (id, data) => {
  return API.put(`/alerts/settings/${id}`, data);
};

export const deleteAlertSetting = (id) => {
  return API.delete(`/alerts/settings/${id}`);
};

export const generateTestAlert = () => {
  return API.post("/alerts/generate-test");
};

export const checkThresholdAlert = (value, alertType) => {
  return API.post(
    `/alerts/check-threshold?value=${value}&alert_type=${alertType}`
  );
};


// =========================
// Advanced AI Recommendation APIs
// =========================
export const getAIRecommendations = (datasetId) => {
  return API.get(`/ai-recommendations/${datasetId}`);
};
// =========================
// Dashboard Widget APIs
// =========================
export const createWidget = (data) => {
  return API.post("/widgets/", data);
};

export const getWidgets = () => {
  return API.get("/widgets/");
};

export const updateWidget = (id, data) => {
  return API.put(`/widgets/${id}`, data);
};

export const deleteWidget = (id) => {
  return API.delete(`/widgets/${id}`);
};
// =========================
// Real Model Comparison API
// =========================
export const getRealModelComparison = (datasetId) => {
  return API.get(`/real-model-comparison/${datasetId}`);
};
export const getForecastConfidence = () => {
  return API.get("/confidence/");
};
export const getModelConfidence = (datasetId) => {
  return API.get(`/model-confidence/${datasetId}`);
};
export const getSchedulerStatus = () => {
  return API.get("/scheduler/status");
};
export const downloadComparisonPDF = (datasetId) => {
  return API.get(`/comparison-report/pdf/${datasetId}`, {
    responseType: "blob",
  });
};

export const downloadComparisonExcel = (datasetId) => {
  return API.get(`/comparison-report/excel/${datasetId}`, {
    responseType: "blob",
  });
};
export const reorderWidget = (widgetId, direction) => {
  return API.put(`/widgets/reorder/${widgetId}?direction=${direction}`);
};