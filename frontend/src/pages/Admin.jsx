import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import GlobalSearch from "../components/GlobalSearch";
import {
  getActivityLogs,
  getSystemMetrics,
  getApiActivityLogs,
  getApiPerformanceSummary,
} from "../api/phase3Api";
import { getSchedulerStatus } from "../api/phase4Api";

function Admin() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [reports, setReports] = useState([]);
  const [forecastHistory, setForecastHistory] = useState([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [apiActivityLogs, setApiActivityLogs] = useState([]);
  const [apiPerformance, setApiPerformance] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [datasetSearch, setDatasetSearch] = useState("");
  const [forecastSearch, setForecastSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [metricsSearch, setMetricsSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("");
  const [datasetUserFilter, setDatasetUserFilter] = useState("");
  const [forecastModelFilter, setForecastModelFilter] = useState("");
  const [forecastDatasetFilter, setForecastDatasetFilter] = useState("");

  const [userPage, setUserPage] = useState(1);
  const [datasetPage, setDatasetPage] = useState(1);
  const [forecastPage, setForecastPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [metricsPage, setMetricsPage] = useState(1);

  const [userTotalPages, setUserTotalPages] = useState(1);
  const [datasetTotalPages, setDatasetTotalPages] = useState(1);
  const [forecastTotalPages, setForecastTotalPages] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [metricsTotalPages, setMetricsTotalPages] = useState(1);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  const limit = 10;

  useEffect(() => {
    fetchAdminData();

    const interval = setInterval(() => {
      fetchAdminData();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userPage, roleFilter]);

  useEffect(() => {
    fetchDatasets();
  }, [datasetPage, datasetUserFilter]);

  useEffect(() => {
    fetchForecasts();
  }, [forecastPage, forecastModelFilter, forecastDatasetFilter]);

  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  useEffect(() => {
    fetchMetrics();
  }, [metricsPage]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const dashboardRes = await API.get("/admin/dashboard");
      const reportsRes = await API.get("/admin/reports");

      setData(dashboardRes.data);
      setReports(reportsRes.data);

      try {
        const logsRes = await getActivityLogs({ page: 1, limit: 10 });
        setActivityLogs(logsRes.data.data || []);
      } catch {
        setActivityLogs([]);
      }

      try {
        const systemRes = await getSystemMetrics();
        setSystemMetrics(systemRes.data);
      } catch {
        setSystemMetrics(null);
      }
      try {
        const apiLogsRes = await getApiActivityLogs({
          page: 1,
          limit: 10,
        });

        setApiActivityLogs(apiLogsRes.data.data || []);
      } catch (error) {
        console.error("API logs failed:", error);
        setApiActivityLogs([]);
      }
      const fetchSchedulerStatus = async () => {
        try {
          const response = await getSchedulerStatus();
          setSchedulerStatus(response.data);
        } catch (error) {
          console.log("Scheduler status failed:", error);
        }
      };
     
      try {
        const perfRes = await getApiPerformanceSummary();
        setApiPerformance(perfRes.data);
      } catch (error) {
        console.error("API performance failed:", error);
        setApiPerformance(null);
      }

      await fetchUsers();
      await fetchDatasets();
      await fetchForecasts();
      await fetchHistory();
      await fetchMetrics();
      await fetchSchedulerStatus();

      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Admin API failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await API.get(
        `/admin/users?page=${userPage}&limit=${limit}&search=${userSearch}&role=${roleFilter}`
      );
      setUsers(response.data.data || []);
      setUserTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
    }
  };
  const updateStatus = async (userId, status) => {
    try {
      await API.put(`/admin/users/${userId}/status?account_status=${status}`);
      alert("User status updated successfully");
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.detail || "Status update failed");
    }
  };

  const fetchDatasets = async () => {
  try {
    const response = await API.get(
      `/admin/datasets?page=${datasetPage}&limit=${limit}&search=${datasetSearch}&user_id=${datasetUserFilter}`
    );

    console.log("Admin datasets:", response.data);

    setDatasets(response.data.data || []);
    setDatasetTotalPages(response.data.total_pages || 1);
  } catch (error) {
    console.log("Dataset fetch error:", error.response);
  }
};

  const fetchForecasts = async () => {
  try {
    const response = await API.get(
      `/admin/forecasts?page=${forecastPage}&limit=${limit}&search=${forecastSearch}&model_name=${forecastModelFilter}&dataset_id=${forecastDatasetFilter}`
    );

    console.log("Admin forecasts:", response.data);

    setForecasts(response.data.data || []);
    setForecastTotalPages(response.data.total_pages || 1);
  } catch (error) {
    console.log("Forecast fetch error:", error.response);
  }
};

  const fetchHistory = async () => {
    try {
      const response = await API.get(
        `/admin/forecast-history?page=${historyPage}&limit=${limit}&search=${historySearch}`
      );
      setForecastHistory(response.data.data || []);
      setHistoryTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await API.get(
        `/admin/accuracy-metrics?page=${metricsPage}&limit=${limit}&search=${metricsSearch}`
      );
      setAccuracyMetrics(response.data.data || []);
      setMetricsTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await API.put(`/admin/users/${userId}/role?role=${role}`);
      alert("User role updated successfully");
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.detail || "Role update failed");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await API.delete(`/admin/users/${userId}`);
      alert("User deleted successfully");
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.detail || "User delete failed");
    }
  };

  const deleteDataset = async (datasetId) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;

    try {
      await API.delete(`/admin/datasets/${datasetId}`);
      alert("Dataset deleted successfully");
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.detail || "Dataset delete failed");
    }
  };

  const downloadAdminReport = async (url, filename) => {
    try {
      const response = await API.get(url, { responseType: "blob" });
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = fileURL;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alert(error.response?.data?.detail || "Report download failed");
    }
  };

  const Pagination = ({ page, totalPages, setPage }) => (
    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold ${
          page <= 1
            ? "bg-gray-300 text-gray-500"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Previous
      </button>

      <span className="font-semibold text-gray-700">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold ${
          page >= totalPages
            ? "bg-gray-300 text-gray-500"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Next
      </button>
    </div>
  );

  const SearchBox = ({ value, setValue, onSearch, placeholder }) => (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        className="border p-3 rounded-xl w-full focus:outline-none focus:ring-4 focus:ring-blue-200"
      />

      <button
        onClick={onSearch}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
      >
        Search
      </button>
    </div>
  );

  const EmptyState = ({ message }) => (
  <div className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-300 p-6 rounded-2xl text-center">
    {message}
  </div>
);

  const TableCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-4 md:p-8 overflow-hidden transition-colors">
    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
      {title}
    </h2>
    {children}
  </div>
);

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner text="Loading admin panel..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-100 text-red-700 p-6 rounded-2xl font-bold">
          {error}
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="text-xl font-bold">No admin data available.</div>
      </PageLayout>
    );
  }

  const stats = data.stats || {};

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "datasets", label: "Datasets" },
    { key: "forecasts", label: "Forecasts" },
    { key: "history", label: "Forecast History" },
    { key: "metrics", label: "Accuracy Metrics" },
    { key: "reports", label: "Reports" },
    { key: "activity", label: "Activity Logs" },
    { key: "system", label: "System Metrics" },
    { key: "api_logs", label: "API Logs" },
    { key: "api_performance", label: "API Performance" },

  ];

  return (
    <PageLayout>
      <div className="space-y-8 text-gray-900 dark:text-white">
        <div className="bg-gradient-to-r from-gray-900 to-blue-800 text-white rounded-3xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-3 text-gray-200 text-sm md:text-base">
            Welcome, {data.admin?.name}. Manage users, datasets, forecasts,
            reports, pagination, search, and system analytics.
          </p>
        </div>

        <GlobalSearch />

        <div className="flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-5 py-3 rounded-xl font-bold transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.total_users || 0} color="bg-blue-600" />
            <StatCard title="Super Admin" value={stats.total_admins || 0} color="bg-indigo-600" />
            <StatCard title="Viewers" value={stats.total_normal_users || 0} color="bg-green-600" />
            <StatCard title="Datasets" value={stats.total_datasets || 0} color="bg-purple-600" />
            <StatCard title="Forecasts" value={stats.total_forecasts || 0} color="bg-orange-600" />
            <StatCard title="Notifications" value={stats.total_notifications || 0} color="bg-red-600" />
            <StatCard title="Forecast History" value={stats.total_forecast_history || 0} color="bg-teal-600" />
            <StatCard title="Accuracy Metrics" value={stats.total_accuracy_metrics || 0} color="bg-pink-600" />
          </div>
        )}

        {schedulerStatus && (
          <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow p-6">
            <h3 className="text-xl font-bold mb-4">Background Scheduler</h3>

            <p>
              Status:
              <span
                className={`ml-2 font-bold ${
                  schedulerStatus.scheduler_running
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {schedulerStatus.scheduler_running ? "Running" : "Stopped"}
              </span>
            </p>

            <p className="mt-2">Total Schedules: {schedulerStatus.total_schedules}</p>

            <p className="mt-2">Active Schedules: {schedulerStatus.active_schedules}</p>

            <p className="mt-2">Pending Schedules: {schedulerStatus.pending_schedules}</p>
          </div>
        )}

        {activeTab === "users" && (
          <TableCard title="Manage Users">
            <SearchBox
              value={userSearch}
              setValue={setUserSearch}
              onSearch={() => {
                setUserPage(1);
                setTimeout(fetchUsers, 100);
              }}
              placeholder="Search users by name, email, or role..."
            />

            <div className="mb-6">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="border p-3 rounded-xl"
              >
                <option value="">All Roles</option>
                <option value="super_admin">super_admin</option>
                <option value="analyst">analyst</option>
                <option value="viewer">viewer</option>
              </select>
            </div>

            {users.length === 0 ? (
              <EmptyState message="No users found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Change Role</th>
                      <th className="p-3 text-left">Action</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{user.id}</td>
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.role}</td>
                        <td className="p-3">
                          <select
                            value={user.account_status || "active"}
                            onChange={(e) => updateStatus(user.id, e.target.value)}
                            className="border p-2 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-700"
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                            <option value="suspended">suspended</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateRole(user.id, e.target.value)}
                            className="border p-2 rounded-lg"
                          >
                            <option value="super_admin">super_admin</option>
                            <option value="analyst">analyst</option>
                            <option value="viewer">viewer</option>
                            
                          </select>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={userPage} totalPages={userTotalPages} setPage={setUserPage} />
          </TableCard>
        )}

        {activeTab === "datasets" && (
          <TableCard title="Manage Datasets">
            <SearchBox
              value={datasetSearch}
              setValue={setDatasetSearch}
              onSearch={() => {
                setDatasetPage(1);
                setTimeout(fetchDatasets, 100);
              }}
              placeholder="Search datasets by file name or file path..."
            />

            <div className="mb-6">
              <input
                type="number"
                placeholder="Filter by User ID"
                value={datasetUserFilter}
                onChange={(e) => {
                  setDatasetUserFilter(e.target.value);
                  setDatasetPage(1);
                }}
                className="border p-3 rounded-xl"
              />
            </div>

            {datasets.length === 0 ? (
              <EmptyState message="No datasets found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">File Name</th>
                      <th className="p-3 text-left">User ID</th>
                      <th className="p-3 text-left">File Path</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {datasets.map((dataset) => (
                      <tr key={dataset.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{dataset.id}</td>
                        <td className="p-3">{dataset.file_name}</td>
                        <td className="p-3">{dataset.user_id}</td>
                        <td className="p-3 text-sm text-gray-500">{dataset.file_path}</td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteDataset(dataset.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={datasetPage} totalPages={datasetTotalPages} setPage={setDatasetPage} />
          </TableCard>
        )}

        {activeTab === "forecasts" && (
          <TableCard title="Monitor Forecasting Activities">
            <SearchBox
              value={forecastSearch}
              setValue={setForecastSearch}
              onSearch={() => {
                setForecastPage(1);
                setTimeout(fetchForecasts, 100);
              }}
              placeholder="Search forecasts by product name..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Filter by Model Name"
                value={forecastModelFilter}
                onChange={(e) => {
                  setForecastModelFilter(e.target.value);
                  setForecastPage(1);
                }}
                className="border p-3 rounded-xl"
              />

              <input
                type="number"
                placeholder="Filter by Dataset ID"
                value={forecastDatasetFilter}
                onChange={(e) => {
                  setForecastDatasetFilter(e.target.value);
                  setForecastPage(1);
                }}
                className="border p-3 rounded-xl"
              />
            </div>

            {forecasts.length === 0 ? (
              <EmptyState message="No forecasts found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Predicted Sales</th>
                      <th className="p-3 text-left">Dataset ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {forecasts.map((forecast) => (
                      <tr key={forecast.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{forecast.id}</td>
                        <td className="p-3">{forecast.product_name}</td>
                        <td className="p-3">₹ {forecast.predicted_sales}</td>
                        <td className="p-3">{forecast.dataset_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={forecastPage} totalPages={forecastTotalPages} setPage={setForecastPage} />
          </TableCard>
        )}
        {activeTab === "history" && (
          <TableCard title="Forecast History">
            <SearchBox
              value={historySearch}
              setValue={setHistorySearch}
              onSearch={() => {
                setHistoryPage(1);
                setTimeout(fetchHistory, 100);
              }}
              placeholder="Search history by model or top product..."
            />

            {forecastHistory.length === 0 ? (
              <EmptyState message="No forecast history found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">User ID</th>
                      <th className="p-3 text-left">Dataset ID</th>
                      <th className="p-3 text-left">Model</th>
                      <th className="p-3 text-left">Days</th>
                      <th className="p-3 text-left">Top Product</th>
                      <th className="p-3 text-left">Created At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {forecastHistory.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{item.id}</td>
                        <td className="p-3">{item.user_id}</td>
                        <td className="p-3">{item.dataset_id}</td>
                        <td className="p-3">{item.model_name}</td>
                        <td className="p-3">{item.forecast_days}</td>
                        <td className="p-3">{item.top_demand_product}</td>
                        <td className="p-3 text-sm">{item.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={historyPage}
              totalPages={historyTotalPages}
              setPage={setHistoryPage}
            />
          </TableCard>
        )}
          {activeTab === "metrics" && (
          <TableCard title="Accuracy Metrics">
            <SearchBox
              value={metricsSearch}
              setValue={setMetricsSearch}
              onSearch={() => {
                setMetricsPage(1);
                setTimeout(fetchMetrics, 100);
              }}
              placeholder="Search metrics by model name..."
            />

            {accuracyMetrics.length === 0 ? (
              <EmptyState message="No accuracy metrics found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">User ID</th>
                      <th className="p-3 text-left">Dataset ID</th>
                      <th className="p-3 text-left">Model</th>
                      <th className="p-3 text-left">MAE</th>
                      <th className="p-3 text-left">RMSE</th>
                      <th className="p-3 text-left">MAPE</th>
                      <th className="p-3 text-left">Created At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {accuracyMetrics.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{item.id}</td>
                        <td className="p-3">{item.user_id}</td>
                        <td className="p-3">{item.dataset_id}</td>
                        <td className="p-3">{item.model_name}</td>
                        <td className="p-3">{item.mae}</td>
                        <td className="p-3">{item.rmse}</td>
                        <td className="p-3">{item.mape}%</td>
                        <td className="p-3 text-sm">{item.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={metricsPage}
              totalPages={metricsTotalPages}
              setPage={setMetricsPage}
            />
          </TableCard>
        )}
          {activeTab === "reports" && (
            <TableCard title="Admin Reports For All Users">
              {reports.length === 0 ? (
                <EmptyState message="No reports available." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map((report, index) => (
                      <div
                        key={index}
                        className="border rounded-2xl p-6 hover:shadow-lg transition"
                      >
                        <div className="text-5xl mb-4">
                          {report.type === "Excel" ? "📊" : "📄"}
                        </div>

                        <h3 className="text-xl font-bold">{report.name}</h3>

                        <p className="text-gray-500 mt-2">
                          Type: {report.type}
                        </p>

                        <button
                          onClick={() =>
                            downloadAdminReport(
                              report.endpoint,
                              report.type === "Excel"
                                ? "admin_all_forecast_report.xlsx"
                                : "admin_dashboard_report.pdf"
                            )
                          }
                          className={`mt-6 w-full text-white px-4 py-3 rounded-xl font-bold ${
                            report.type === "Excel"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          Open / Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TableCard>
            )}

        {activeTab === "activity" && (
          <TableCard title="Activity Logs">
            {activityLogs.length === 0 ? (
              <EmptyState message="No activity logs found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">User ID</th>
                      <th className="p-3 text-left">Action</th>
                      <th className="p-3 text-left">Module</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Created At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{log.id}</td>
                        <td className="p-3">{log.user_id}</td>
                        <td className="p-3 font-bold">{log.action}</td>
                        <td className="p-3">{log.module}</td>
                        <td className="p-3">{log.description}</td>
                        <td className="p-3">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        )}

        {activeTab === "system" && (
          <TableCard title="System Metrics">
            {systemMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="API Status" value={systemMetrics.api_status} color="bg-green-600" />
                <StatCard title="Database" value={systemMetrics.database_status} color="bg-blue-600" />
                <StatCard title="Users" value={systemMetrics.total_users} color="bg-purple-600" />
                <StatCard title="Datasets" value={systemMetrics.total_datasets} color="bg-orange-600" />
                <StatCard title="Forecasts" value={systemMetrics.total_forecasts} color="bg-indigo-600" />
                <StatCard title="Notifications" value={systemMetrics.total_notifications} color="bg-red-600" />
                <StatCard title="Unread" value={systemMetrics.unread_notifications} color="bg-pink-600" />
                <StatCard title="Activity Logs" value={systemMetrics.total_activity_logs} color="bg-teal-600" />
                <StatCard title="API Logs" value={systemMetrics.total_api_logs || 0} color="bg-cyan-600" />
              </div>
            ) : (
              <EmptyState message="No system metrics found." />
            )}
          </TableCard>
        )}
        {activeTab === "api_logs" && (
          <TableCard title="API Activity Logs">
            {apiActivityLogs.length === 0 ? (
              <EmptyState message="No API activity logs found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">User ID</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Path</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Response Time</th>
                      <th className="p-3 text-left">Created At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {apiActivityLogs.map((log) => (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{log.id}</td>
                        <td className="p-3">{log.user_id || "Guest"}</td>
                        <td className="p-3 font-bold">{log.method}</td>
                        <td className="p-3 text-sm">{log.path}</td>
                        <td className="p-3">{log.status_code}</td>
                        <td className="p-3">{log.response_time_ms} ms</td>
                        <td className="p-3 text-sm">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        )}
              {activeTab === "api_performance" && (
        <TableCard title="API Performance Monitoring">
          {apiPerformance ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                  title="APIs Checked"
                  value={apiPerformance.total_checked}
                  color="bg-blue-600"
                />
                <StatCard
                  title="Slow APIs"
                  value={apiPerformance.slow_api_count}
                  color="bg-red-600"
                />
                <StatCard
                  title="Avg Response"
                  value={`${apiPerformance.average_response_time} ms`}
                  color="bg-purple-600"
                />
              </div>

              <div className="bg-red-50 dark:bg-red-950 p-5 rounded-2xl">
                <h3 className="font-bold text-red-700 dark:text-red-300 mb-4">
                  Slow API Alerts
                </h3>

                {apiPerformance.alerts?.length > 0 ? (
                  <div className="space-y-3">
                    {apiPerformance.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-700"
                      >
                        <p className="font-bold text-gray-800 dark:text-white">
                          {alert.message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Response Time: {alert.response_time_ms} ms
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No slow API alerts." />
                )}
              </div>
            </div>
          ) : (
            <EmptyState message="No API performance data found." />
          )}
        </TableCard>
      )}

      </div>

    </PageLayout>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-2xl shadow-lg`}>
      <p className="text-sm opacity-90">{title}</p>
      <h2 className="text-4xl font-bold mt-3">{value ?? 0}</h2>
    </div>
  );
}

export default Admin;