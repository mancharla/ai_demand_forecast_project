import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import API from "../api/axios";

import { getWidgets,  } from "../api/phase4Api";

import {
  getRegionAnalytics,
  getCategoryInsights,
  getRevenuePrediction,
  getInventoryRisk,
  getAnomalies,
  getSeasonalTrends,
  getBusinessInsights,
  getRealtimeDashboard,
  getRegionDrilldown,
  getProductDrilldown,
} from "../api/phase3Api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");

  const [regionAnalytics, setRegionAnalytics] = useState([]);
  const [categoryInsights, setCategoryInsights] = useState([]);
  const [revenuePrediction, setRevenuePrediction] = useState(null);
  const [inventoryRisk, setInventoryRisk] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [seasonalTrends, setSeasonalTrends] = useState(null);
  const [businessInsights, setBusinessInsights] = useState([]);
  const [realtimeData, setRealtimeData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [confidenceData, setConfidenceData] = useState([]);
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionDetails, setRegionDetails] = useState(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);

  const fetchDatasets = async () => {
    try {
      const response = await API.get("/datasets/my-datasets");
      const datasetList = response.data || [];

      setDatasets(datasetList);

      if (datasetList.length > 0 && !selectedDataset) {
        const latestDatasetId = datasetList[0].id;
        setSelectedDataset(latestDatasetId);
        return latestDatasetId;
      }

      return selectedDataset || datasetList[0]?.id || "";
    } catch (error) {
      console.error("Dataset fetch failed:", error);
      setDatasets([]);
      return "";
    }
  };
  const openRegionDrilldown = async (region) => {
  try {
    if (!selectedDataset) {
      alert("Select dataset first");
      return;
    }

    setLoadingDrilldown(true);

    const response = await getRegionDrilldown(
        selectedDataset,
        encodeURIComponent(region)
);

    setRegionDetails(response.data);

    setRegionModalOpen(true);
  } catch (error) {
    alert(
      error.response?.data?.detail ||
        "Failed to load region analytics"
    );
  } finally {
    setLoadingDrilldown(false);
  }
};

  const fetchDashboardData = async () => {
    try {
      const response = await API.get("/dashboard/forecast-analysis");
      setDashboardData(response.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Dashboard loading failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraDashboardData = async (datasetId = "") => {
    const finalDatasetId = datasetId || selectedDataset;

    try {
        const res = await API.get("/confidence/");
        setConfidenceData(res.data || []);
      } catch (error) {
        console.error("Confidence fetch error:", error);
        setConfidenceData([]);
      }

    try {
      const res = await getRegionAnalytics(finalDatasetId);
      setRegionAnalytics(res.data || []);
    } catch {
      setRegionAnalytics([]);
    }

    try {
      const res = await getCategoryInsights(finalDatasetId);
      setCategoryInsights(res.data || []);
    } catch {
      setCategoryInsights([]);
    }

    try {
      const res = await getRevenuePrediction(finalDatasetId);
      setRevenuePrediction(res.data || null);
    } catch {
      setRevenuePrediction(null);
    }

    try {
      const res = await getInventoryRisk(finalDatasetId);
      setInventoryRisk(res.data || []);
    } catch {
      setInventoryRisk([]);
    }

    try {
      const res = await getAnomalies(finalDatasetId);
      setAnomalies(res.data || []);
    } catch {
      setAnomalies([]);
    }

    try {
      const res = await getSeasonalTrends(finalDatasetId);
      setSeasonalTrends(res.data || null);
    } catch {
      setSeasonalTrends(null);
    }

    try {
      const res = await getBusinessInsights(finalDatasetId);
      setBusinessInsights(res.data?.insights || res.data || []);
    } catch {
      setBusinessInsights([]);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await getRealtimeDashboard();
      setRealtimeData(response.data);
    } catch {
      setRealtimeData(null);
    }
  };

  const fetchWidgets = async () => {
    try {
      const response = await getWidgets();
      setWidgets(response.data || []);
    } catch {
      setWidgets([]);
    }
  };

  const isWidgetVisible = (widgetName) => {
    if (!widgets || widgets.length === 0) return true;

    const widget = widgets.find((item) => item.widget_name === widgetName);

    if (!widget) return true;

    return widget.is_visible === 1;
  };

  const downloadDashboardSummary = async () => {
    try {
      const response = await API.get("/reports/dashboard/summary/excel", {
        responseType: "blob",
      });

      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = fileURL;
      link.setAttribute("download", "dashboard_summary.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alert(error.response?.data?.detail || "Dashboard summary download failed");
    }
  };

  const handleDatasetChange = async (datasetId) => {
    setSelectedDataset(datasetId);
    await fetchExtraDashboardData(datasetId);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      const datasetId = await fetchDatasets();

      fetchDashboardData();
      fetchExtraDashboardData(datasetId);
      fetchWidgets();
      fetchRealtimeData();
    };

    loadDashboard();

    const interval = setInterval(async () => {
      const datasetId = await fetchDatasets();

      fetchDashboardData();
      fetchExtraDashboardData(datasetId);
      fetchWidgets();
      fetchRealtimeData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner text="Loading dashboard..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 p-6 rounded-2xl font-bold">
          {error}
        </div>
      </PageLayout>
    );
  }

  const summary = dashboardData?.summary || {};
  const productSales = dashboardData?.product_sales || [];
  const recentActivity = dashboardData?.recent_activity || [];
  const monthlySales = dashboardData?.monthly_sales || [];

  const pieColors = [
    "#2563eb",
    "#7c3aed",
    "#dc2626",
    "#059669",
    "#ea580c",
    "#0891b2",
  ];

  return (
    <PageLayout>
      <div className="space-y-8 text-gray-900 dark:text-white">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            AI Demand Forecasting Dashboard
          </h1>

          <p className="mt-3 text-blue-100">
            Monitor original dataset analytics, forecasts, revenue, inventory
            risk, and AI insights.
          </p>

          <div className="flex items-center justify-between flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Dashboard Active
            </div>

            {lastUpdated && (
              <div className="text-sm text-blue-100">
                Last Updated: {lastUpdated}
              </div>
            )}
          </div>
        </div>

        {realtimeData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
            <RealtimeCard
              title="Live Sales"
              value={`₹ ${realtimeData.live_sales || 0}`}
              color="text-green-600"
            />
            <RealtimeCard
              title="Active Users"
              value={realtimeData.active_users || 0}
              color="text-blue-600"
            />
            <RealtimeCard
              title="Forecast Accuracy"
              value={`${realtimeData.forecast_accuracy || 0}%`}
              color="text-purple-600"
            />
            <RealtimeCard
              title="System Load"
              value={`${realtimeData.system_load || 0}%`}
              color="text-orange-600"
            />
            <RealtimeCard
              title="New Orders"
              value={realtimeData.new_orders || 0}
              color="text-red-600"
            />
          </div>
        )}

        {isWidgetVisible("Total Sales") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={summary.total_products || 0}
              color="bg-blue-600"
            />
            <StatCard
              title="Total Regions"
              value={summary.total_regions || 0}
              color="bg-purple-600"
            />
            <StatCard
              title="Total Sales"
              value={`₹ ${summary.total_sales || 0}`}
              color="bg-green-600"
            />
            <StatCard
              title="Top Product"
              value={summary.top_product || "N/A"}
              color="bg-orange-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isWidgetVisible("AI Insights") && (
            <Card title="AI Business Insights">
              {businessInsights.length > 0 ? (
                <ul className="space-y-3">
                  {businessInsights.map((insight, index) => (
                    <li
                      key={index}
                      className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-4 rounded-xl"
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty message="No insights available." />
              )}
            </Card>
          )}

          <Card title="Forecast Confidence Score">
            {confidenceData.length > 0 ? (
              <div className="space-y-4">
                {confidenceData.map((item, index) => (
                  <div
                    key={`${item.model_name}-${index}`}
                    className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{item.model_name}</span>
                      <span>{item.confidence_score}%</span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                          width: `${Math.min(
                            Number(item.confidence_score || 0),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>

                    <p className="text-sm mt-2 text-gray-500 dark:text-gray-300">
                      Confidence Level: {item.confidence_level}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty message="Select a dataset or generate model comparison to view confidence scores." />
            )}
          </Card>
        </div>

        <Card title="Dashboard Controls">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Dataset
              </label>

              <select
                value={selectedDataset}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Dataset</option>

                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.original_filename || dataset.filename}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={downloadDashboardSummary}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow w-full md:w-auto"
            >
              Download Dashboard Summary
            </button>
          </div>
        </Card>

        <Card title="Revenue Prediction">
          {revenuePrediction ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950 overflow-x-auto">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                  Revenue Metrics
                </h3>

                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                  <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Metric</th>
                      <th className="px-4 py-3 text-left">Value</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    <tr>
                      <td className="px-4 py-3">Total Revenue</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(revenuePrediction.total_revenue)}
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-3">Average Revenue</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(revenuePrediction.average_revenue)}
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-3">Max Revenue</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(revenuePrediction.max_revenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <RevenueTable
                items={revenuePrediction.top_revenue_products || []}
              />

              {(revenuePrediction.monthly_revenue || []).length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950 overflow-x-auto">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                    Monthly Revenue
                  </h3>

                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                    <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-left">Month</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {revenuePrediction.monthly_revenue.map((item, index) => (
                        <tr key={`${item.month}-${index}`}>
                          <td className="px-4 py-3">{item.month}</td>
                          <td className="px-4 py-3 font-semibold">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <Empty message="No revenue prediction available." />
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isWidgetVisible("Region Analytics") && (
            <Card title="Region Sales Analytics">
              {regionAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={regionAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                    dataKey="total_sales"
                    fill="#2563eb"
                    onClick={(data) => {
                    const region = data?.payload?.region || data?.region;

                    if (region) {
                      openRegionDrilldown(region);
                    }
                  }}
                  />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty message="No region analytics available." />
              )}
            </Card>
          )}

          <Card title="Category Insights">
            {categoryInsights.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryInsights}
                    dataKey="total_sales"
                    nameKey="category"
                    outerRadius={110}
                    label
                  >
                    {categoryInsights.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="No category insights available." />
            )}
          </Card>
        </div>

        <Card title="Monthly Seasonal Sales Trend">
          {(seasonalTrends?.monthly_trends || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={seasonalTrends.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty message="No seasonal trend data available." />
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isWidgetVisible("Inventory Risk") && (
            <Card title="Inventory Risk Analysis">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventoryRisk.length > 0 ? (
                  inventoryRisk.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800"
                    >
                      <p className="font-bold">{item.product}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Predicted Sales: {item.predicted_sales}
                      </p>
                      <p className="text-sm font-semibold text-red-600">
                        {item.risk}
                      </p>
                    </div>
                  ))
                ) : (
                  <Empty message="No inventory risk data." />
                )}
              </div>
            </Card>
          )}

          <Card title="Sales Anomalies">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {anomalies.length > 0 ? (
                anomalies.map((item, index) => (
                  <div
                    key={index}
                    className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-xl p-4"
                  >
                    <p className="font-bold text-red-700 dark:text-red-300">
                      {item.product}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Sales: {item.sales}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Region: {item.region}
                    </p>

                    <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                      {item.reason || "Unusual sales value detected"}
                    </p>
                  </div>
                ))
              ) : (
                <Empty message="No anomalies detected." />
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Top Product Sales">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {productSales.length > 0 ? (
                productSales.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl"
                  >
                    <span>{item.product}</span>
                    <span className="font-bold">{item.sales}</span>
                  </div>
                ))
              ) : (
                <Empty message="No product sales available." />
              )}
            </div>
          </Card>

          <Card title="Recent Forecast Activity">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl"
                  >
                    <p className="font-bold">{item.product_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Predicted Sales: {item.predicted_sales}
                    </p>
                    <p className="text-xs text-gray-400">
                      Dataset ID: {item.dataset_id}
                    </p>
                  </div>
                ))
              ) : (
                <Empty message="No recent activity." />
              )}
            </div>
          </Card>
        </div>

        <Card title="Monthly Sales">
          {monthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#059669"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty message="No monthly sales data available." />
          )}
        </Card>
      </div>
      {loadingDrilldown && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl">
            <LoadingSpinner text="Loading region analytics..." />
          </div>
        </div>
      )}
      {regionModalOpen && regionDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {regionDetails.region} Region Analytics
              </h2>

              <button
                onClick={() => setRegionModalOpen(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">

              <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Total Sales
                </p>

                <p className="text-2xl font-bold">
                  ₹ {regionDetails.total_sales}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Products
                </p>

                <p className="text-2xl font-bold">
                  {regionDetails.products?.length || 0}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Categories
                </p>

                <p className="text-2xl font-bold">
                  {regionDetails.categories?.length || 0}
                </p>
              </div>

            </div>

            <Card title="Top Products">

              <SimpleTable
                data={regionDetails.products || []}
                columns={["product", "sales"]}
              />

            </Card>
            <div className="mt-6">
            <Card title="Top Categories">
              <SimpleTable
                data={regionDetails.categories || []}
                columns={["category", "sales"]}
              />
            </Card>
          </div>

            <div className="mt-6">

              <Card title="Monthly Trend">

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={regionDetails.monthly_sales || []}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#2563eb"
                    />
                  </LineChart>
                </ResponsiveContainer>

              </Card>

            </div>

          </div>
        </div>
      )}
    </PageLayout>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white rounded-2xl shadow-lg p-6`}>
      <p className="text-sm opacity-90">{title}</p>
      <h2 className="text-2xl md:text-3xl font-bold mt-3 break-words">
        {value}
      </h2>
    </div>
  );
}

function RealtimeCard({ title, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-5 transition-colors">
      <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
      <h3 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h3>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors">
      <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}

function RevenueTable({ items }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-gray-900">
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((item, index) => (
                <tr key={item.product || index}>
                  <td className="px-4 py-3 font-semibold">{index + 1}</td>
                  <td className="px-4 py-3">{item.product}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-300">No revenue data available.</p>
      )}
    </div>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "₹ 0.00";
  }

  return `₹ ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Empty({ message }) {
  return <p className="text-gray-500 dark:text-gray-300">{message}</p>;
}
function SimpleTable({ data, columns }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-300">No data found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border dark:border-slate-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-800">
            {columns.map((col) => (
              <th key={col} className="p-3 text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-t dark:border-slate-700">
              {columns.map((col) => (
                <td key={col} className="p-3">
                  {col === "sales"
                   ? `₹ ${Number(item[col] || 0).toLocaleString("en-IN")}`
                   : String(item[col] ?? "N/A")}
                  </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;