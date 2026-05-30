import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  createForecastSchedule,
  getForecastSchedules,
  deleteForecastSchedule,
  runForecastScheduleNow,
  createIntegration,
  getIntegrations,
  deleteIntegration,
  testIntegration,
  createAlertSetting,
  getAlertSettings,
  deleteAlertSetting,
  generateTestAlert,
  getAIRecommendations,
  createWidget,
  getWidgets,
  updateWidget,
  deleteWidget,
  reorderWidget,
  getRealModelComparison,
  downloadComparisonPDF,
  downloadComparisonExcel,
} from "../api/phase4Api";

function Phase4() {
  const [datasets, setDatasets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [aiData, setAiData] = useState(null);

  const [selectedDataset, setSelectedDataset] = useState("");
  const [comparisonDataset, setComparisonDataset] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("automation");

  const [scheduleForm, setScheduleForm] = useState({
    dataset_id: "",
    schedule_name: "",
    forecast_days: 30,
    interval_type: "daily",
    model_type: "best",
  });

  const [integrationForm, setIntegrationForm] = useState({
    integration_name: "",
    integration_type: "API",
    api_url: "",
    api_key: "",
    webhook_url: "",
  });

  const [alertForm, setAlertForm] = useState({
    alert_name: "",
    alert_type: "demand_spike",
    threshold_value: 10000,
    email_enabled: 0,
    in_app_enabled: 1,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const datasetRes = await API.get("/datasets/my-datasets");
      setDatasets(datasetRes.data || []);

      const scheduleRes = await getForecastSchedules();
      setSchedules(scheduleRes.data || []);

      const integrationRes = await getIntegrations();
      setIntegrations(integrationRes.data || []);

      const alertRes = await getAlertSettings();
      setAlerts(alertRes.data || []);

      const widgetRes = await getWidgets();
      setWidgets(widgetRes.data || []);
    } catch (error) {
      console.error("Phase 4 data fetch failed:", error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await createForecastSchedule({
        ...scheduleForm,
        dataset_id: Number(scheduleForm.dataset_id),
        forecast_days: Number(scheduleForm.forecast_days),
      });

      setScheduleForm({
        dataset_id: "",
        schedule_name: "",
        forecast_days: 30,
        interval_type: "daily",
        model_type: "best",
      });

      fetchAll();
      toast.success("Schedule created successfully");
    } catch (error) {
      toast.error("Schedule creation failed");
    }
  };

  const handleCreateIntegration = async () => {
    try {
      await createIntegration(integrationForm);

      setIntegrationForm({
        integration_name: "",
        integration_type: "API",
        api_url: "",
        api_key: "",
        webhook_url: "",
      });

      fetchAll();
      toast.success("Integration created successfully");
    } catch (error) {
      alert(error.response?.data?.detail || "Integration failed");
    }
  };

  const handleCreateAlert = async () => {
    try {
      await createAlertSetting({
        ...alertForm,
        threshold_value: Number(alertForm.threshold_value),
      });

      setAlertForm({
        alert_name: "",
        alert_type: "demand_spike",
        threshold_value: 10000,
        email_enabled: 0,
        in_app_enabled: 1,
      });

      fetchAll();
      toast.success("Alert setting created successfully");
    } catch (error) {
      alert(error.response?.data?.detail || "Alert creation failed");
    }
  };

  const loadAIRecommendations = async () => {
    if (!selectedDataset) {
      alert("Select dataset first");
      return;
    }

    try {
      const response = await getAIRecommendations(selectedDataset);
      setAiData(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || "AI recommendations failed");
    }
  };

  const runRealModelComparison = async () => {
    if (!comparisonDataset) {
      toast.error("Select dataset first");
      return;
    }

    try {
      setComparisonLoading(true);
      const response = await getRealModelComparison(comparisonDataset);
      setComparisonData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Model comparison failed");
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleDownloadComparisonPDF = async () => {
    try {
      if (!comparisonDataset) {
        toast.error("Select dataset first");
        return;
      }

      const response = await downloadComparisonPDF(comparisonDataset);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = "model_comparison_report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.detail || "PDF download failed");
    }
  };

  const handleDownloadComparisonExcel = async () => {
    try {
      if (!comparisonDataset) {
        toast.error("Select dataset first");
        return;
      }

      const response = await downloadComparisonExcel(comparisonDataset);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = "model_comparison_report.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.detail || "Excel download failed");
    }
  };

  const tabs = [
    { key: "automation", label: "Smart Automation" },
    { key: "integrations", label: "Enterprise Integrations" },
    { key: "alerts", label: "Alerts" },
    { key: "ai", label: "Advanced AI" },
    { key: "model_comparison", label: "Model Comparison" },
    { key: "widgets", label: "Dashboard Widgets" },
  ];

  return (
    <PageLayout>
      <div className="space-y-8 text-gray-900 dark:text-white">
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-3xl p-6 shadow-xl">
          <h1 className="text-3xl font-bold">AI Recommendations</h1>
          <p className="mt-2 text-indigo-100">
            Smart AI insights, automation, inventory optimization, model
            comparison, and business recommendations.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 text-gray-700 dark:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "automation" && (
          <Card title="Automated Forecast Schedules">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select
                value={scheduleForm.dataset_id}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    dataset_id: e.target.value,
                  })
                }
                className="input"
              >
                <option value="">Select Dataset</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename || d.filename}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Schedule Name"
                value={scheduleForm.schedule_name}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    schedule_name: e.target.value,
                  })
                }
              />

              <input
                className="input"
                type="number"
                placeholder="Forecast Days"
                value={scheduleForm.forecast_days}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    forecast_days: e.target.value,
                  })
                }
              />

              <select
                className="input"
                value={scheduleForm.interval_type}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    interval_type: e.target.value,
                  })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              <button
                onClick={handleCreateSchedule}
                className="bg-blue-600 text-white rounded-xl font-bold"
              >
                Create
              </button>
            </div>

            <SimpleTable
              data={schedules}
              columns={[
                "id",
                "schedule_name",
                "interval_type",
                "forecast_days",
                "is_active",
              ]}
              actions={(item) => (
                <>
                  <button
                    onClick={async () => {
                      await runForecastScheduleNow(item.id);
                      fetchAll();
                    }}
                    className="btn-green"
                  >
                    Run
                  </button>

                  <button
                    onClick={async () => {
                      await deleteForecastSchedule(item.id);
                      fetchAll();
                    }}
                    className="btn-red"
                  >
                    Delete
                  </button>
                </>
              )}
            />
          </Card>
        )}

        {activeTab === "integrations" && (
          <Card title="Enterprise Integrations">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <input
                className="input"
                placeholder="Integration Name"
                value={integrationForm.integration_name}
                onChange={(e) =>
                  setIntegrationForm({
                    ...integrationForm,
                    integration_name: e.target.value,
                  })
                }
              />

              <select
                className="input"
                value={integrationForm.integration_type}
                onChange={(e) =>
                  setIntegrationForm({
                    ...integrationForm,
                    integration_type: e.target.value,
                  })
                }
              >
                <option value="API">API</option>
                <option value="ERP">ERP</option>
                <option value="Inventory">Inventory</option>
                <option value="Webhook">Webhook</option>
              </select>

              <input
                className="input"
                placeholder="API URL"
                value={integrationForm.api_url}
                onChange={(e) =>
                  setIntegrationForm({
                    ...integrationForm,
                    api_url: e.target.value,
                  })
                }
              />

              <input
                className="input"
                placeholder="Webhook URL"
                value={integrationForm.webhook_url}
                onChange={(e) =>
                  setIntegrationForm({
                    ...integrationForm,
                    webhook_url: e.target.value,
                  })
                }
              />

              <button
                onClick={handleCreateIntegration}
                className="bg-blue-600 text-white rounded-xl font-bold"
              >
                Add
              </button>
            </div>

            <SimpleTable
              data={integrations}
              columns={[
                "id",
                "integration_name",
                "integration_type",
                "api_url",
                "is_active",
              ]}
              actions={(item) => (
                <>
                  <button
                    onClick={async () => {
                      await testIntegration(item.id);
                      alert("Integration test completed");
                    }}
                    className="btn-green"
                  >
                    Test
                  </button>

                  <button
                    onClick={async () => {
                      await deleteIntegration(item.id);
                      fetchAll();
                    }}
                    className="btn-red"
                  >
                    Delete
                  </button>
                </>
              )}
            />
          </Card>
        )}

        {activeTab === "alerts" && (
          <Card title="Alert Settings">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <input
                className="input"
                placeholder="Alert Name"
                value={alertForm.alert_name}
                onChange={(e) =>
                  setAlertForm({
                    ...alertForm,
                    alert_name: e.target.value,
                  })
                }
              />

              <select
                className="input"
                value={alertForm.alert_type}
                onChange={(e) =>
                  setAlertForm({
                    ...alertForm,
                    alert_type: e.target.value,
                  })
                }
              >
                <option value="demand_spike">Demand Spike</option>
                <option value="low_stock">Low Stock</option>
                <option value="forecast_failure">Forecast Failure</option>
              </select>

              <input
                className="input"
                type="number"
                value={alertForm.threshold_value}
                onChange={(e) =>
                  setAlertForm({
                    ...alertForm,
                    threshold_value: e.target.value,
                  })
                }
              />

              <button
                onClick={handleCreateAlert}
                className="bg-blue-600 text-white rounded-xl font-bold"
              >
                Create
              </button>

              <button
                onClick={async () => {
                  await generateTestAlert();
                  alert("Test alert generated");
                }}
                className="bg-orange-600 text-white rounded-xl font-bold"
              >
                Test Alert
              </button>
            </div>

            <SimpleTable
              data={alerts}
              columns={[
                "id",
                "alert_name",
                "alert_type",
                "threshold_value",
                "is_active",
              ]}
              actions={(item) => (
                <button
                  onClick={async () => {
                    await deleteAlertSetting(item.id);
                    fetchAll();
                  }}
                  className="btn-red"
                >
                  Delete
                </button>
              )}
            />
          </Card>
        )}

        {activeTab === "ai" && (
          <Card title="Advanced AI Recommendations">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="input"
              >
                <option value="">Select Dataset</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename || d.filename}
                  </option>
                ))}
              </select>

              <button
                onClick={loadAIRecommendations}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                Generate AI Insights
              </button>
            </div>

            {aiData && (
              <div className="space-y-6">
                <Section
                  title="Product Demand Recommendations"
                  data={aiData.product_demand_recommendations}
                />
                <Section
                  title="Customer Buying Behavior"
                  data={aiData.customer_buying_behavior}
                />
                <Section
                  title="Demand Spike Prediction"
                  data={aiData.demand_spike_prediction}
                />
                <Section
                  title="Low Stock Prediction"
                  data={aiData.low_stock_prediction}
                />
                <Section
                  title="Inventory Optimization"
                  data={aiData.inventory_optimization}
                />
              </div>
            )}
          </Card>
        )}

        {activeTab === "model_comparison" && (
          <Card title="Real Multi-Model Forecast Comparison">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <select
                value={comparisonDataset}
                onChange={(e) => setComparisonDataset(e.target.value)}
                className="input"
              >
                <option value="">Select Dataset</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename || d.filename}
                  </option>
                ))}
              </select>

              <button
                onClick={runRealModelComparison}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                {comparisonLoading ? "Comparing..." : "Compare Models"}
              </button>

              <button
                onClick={handleDownloadComparisonPDF}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700"
              >
                Download PDF
              </button>

              <button
                onClick={handleDownloadComparisonExcel}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700"
              >
                Download Excel
              </button>
            </div>

            {comparisonData ? (
              <div className="space-y-8">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-5 rounded-2xl">
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                    Best Model: {comparisonData.best_model?.model}
                  </h3>

                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    Accuracy: {comparisonData.best_model?.accuracy}%
                  </p>

                  <p className="text-gray-700 dark:text-gray-300">
                    RMSE: {comparisonData.best_model?.rmse}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300">
                    MAE: {comparisonData.best_model?.mae}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300">
                    MAPE: {comparisonData.best_model?.mape}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-4">
                    Accuracy Comparison
                  </h3>

                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData.models || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="accuracy" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-4">
                    Error Metrics Comparison
                  </h3>

                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData.models || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="mae" fill="#16a34a" />
                      <Bar dataKey="rmse" fill="#dc2626" />
                      <Bar dataKey="mape" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <SimpleTable
                  data={comparisonData.models || []}
                  columns={["model", "accuracy", "mae", "rmse", "mape"]}
                />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-300">
                Select a dataset and click Compare Models.
              </p>
            )}
          </Card>
        )}

        {activeTab === "widgets" && (
          <Card title="Customizable Dashboard Widgets">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <WidgetButton
                label="Add Total Sales Widget"
                color="bg-blue-600"
                onClick={async () => {
                  await createWidget({
                    widget_name: "Total Sales",
                    widget_type: "kpi",
                    position: 1,
                    is_visible: 1,
                  });
                  fetchAll();
                }}
              />

              <WidgetButton
                label="Add Region Chart Widget"
                color="bg-green-600"
                onClick={async () => {
                  await createWidget({
                    widget_name: "Region Analytics",
                    widget_type: "chart",
                    position: 2,
                    is_visible: 1,
                  });
                  fetchAll();
                }}
              />

              <WidgetButton
                label="Add Inventory Risk Widget"
                color="bg-orange-600"
                onClick={async () => {
                  await createWidget({
                    widget_name: "Inventory Risk",
                    widget_type: "risk",
                    position: 3,
                    is_visible: 1,
                  });
                  fetchAll();
                }}
              />

              <WidgetButton
                label="Add AI Insights Widget"
                color="bg-purple-600"
                onClick={async () => {
                  await createWidget({
                    widget_name: "AI Insights",
                    widget_type: "insights",
                    position: 4,
                    is_visible: 1,
                  });
                  fetchAll();
                }}
              />
              
            </div>

            <SimpleTable
              data={widgets}
              columns={[
                "id",
                "widget_name",
                "widget_type",
                "position",
                "is_visible",
              ]}
              actions={(item) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      await reorderWidget(item.id, "up");
                      fetchAll();
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    ↑
                  </button>

                  <button
                    onClick={async () => {
                      await reorderWidget(item.id, "down");
                      fetchAll();
                    }}
                    className="bg-purple-600 text-white px-3 py-1 rounded"
                  >
                    ↓
                  </button>

                  <button
                    onClick={async () => {
                      await updateWidget(item.id, {
                        is_visible: item.is_visible ? 0 : 1,
                      });
                      fetchAll();
                    }}
                    className="btn-green"
                  >
                    {item.is_visible ? "Hide" : "Show"}
                  </button>
                  

                  <button
                    onClick={async () => {
                      await deleteWidget(item.id);
                      fetchAll();
                    }}
                    className="btn-red"
                  >
                    Delete
                  </button>
                </div>
              )}
            />
          </Card>
        )}
      </div>

      <style>{`
        .input {
          border: 1px solid #d1d5db;
          padding: 12px;
          border-radius: 12px;
          background: white;
          color: #111827;
        }

        .dark .input {
          background: #0f172a;
          color: white;
          border-color: #334155;
        }

        .btn-green {
          background: #16a34a;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          margin-right: 8px;
        }

        .btn-red {
          background: #dc2626;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
        }
      `}</style>
    </PageLayout>
  );
}

function WidgetButton({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white p-3 rounded-xl font-bold`}
    >
      {label}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {children}
    </div>
  );
}

function SimpleTable({ data, columns, actions }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-300">No data found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border dark:border-slate-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-800">
            {columns.map((col) => (
              <th key={col} className="p-3 text-left">
                {col}
              </th>
            ))}
            {actions && <th className="p-3 text-left">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id || `${item.model}-${index}`}
              className="border-t dark:border-slate-700"
            >
              {columns.map((col) => (
                <td key={col} className="p-3">
                  {String(item[col] ?? "N/A")}
                </td>
              ))}
              {actions && <td className="p-3">{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, data }) {
  return (
    <div className="border dark:border-slate-700 rounded-2xl p-5">
      <h3 className="font-bold text-lg mb-3">{title}</h3>

      {!data || data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No insights found.</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <pre
              key={index}
              className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl overflow-x-auto text-sm"
            >
              {typeof item === "string"
                ? item
                : JSON.stringify(item, null, 2)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

export default Phase4;