import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

function Admin() {
  const [data, setData] = useState(null);

  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [reports, setReports] = useState([]);
  const [forecastHistory, setForecastHistory] = useState([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [datasetSearch, setDatasetSearch] = useState("");
  const [forecastSearch, setForecastSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [metricsSearch, setMetricsSearch] = useState("");

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

  const limit = 10;

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userPage]);

  useEffect(() => {
    fetchDatasets();
  }, [datasetPage]);

  useEffect(() => {
    fetchForecasts();
  }, [forecastPage]);

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

      await fetchUsers();
      await fetchDatasets();
      await fetchForecasts();
      await fetchHistory();
      await fetchMetrics();

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
        `/admin/users?page=${userPage}&limit=${limit}&search=${userSearch}`
      );

      setUsers(response.data.data || []);
      setUserTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await API.get(
        `/admin/datasets?page=${datasetPage}&limit=${limit}&search=${datasetSearch}`
      );

      setDatasets(response.data.data || []);
      setDatasetTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
    }
  };

  const fetchForecasts = async () => {
    try {
      const response = await API.get(
        `/admin/forecasts?page=${forecastPage}&limit=${limit}&search=${forecastSearch}`
      );

      setForecasts(response.data.data || []);
      setForecastTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.log(error.response);
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

  const handleUserSearch = () => {
    setUserPage(1);
    setTimeout(fetchUsers, 100);
  };

  const handleDatasetSearch = () => {
    setDatasetPage(1);
    setTimeout(fetchDatasets, 100);
  };

  const handleForecastSearch = () => {
    setForecastPage(1);
    setTimeout(fetchForecasts, 100);
  };

  const handleHistorySearch = () => {
    setHistoryPage(1);
    setTimeout(fetchHistory, 100);
  };

  const handleMetricsSearch = () => {
    setMetricsPage(1);
    setTimeout(fetchMetrics, 100);
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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/admin/users/${userId}`);
      alert("User deleted successfully");
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.detail || "User delete failed");
    }
  };

  const deleteDataset = async (datasetId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this dataset?"
    );

    if (!confirmDelete) return;

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
      const response = await API.get(url, {
        responseType: "blob",
      });

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
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
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
    <div className="bg-gray-50 text-gray-500 p-6 rounded-2xl text-center">
      {message}
    </div>
  );

  const TableCard = ({ title, children }) => (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 overflow-hidden">
      <h2 className="text-xl md:text-2xl font-bold mb-6">{title}</h2>
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

  const stats = data.stats;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "datasets", label: "Datasets" },
    { key: "forecasts", label: "Forecasts" },
    { key: "history", label: "Forecast History" },
    { key: "metrics", label: "Accuracy Metrics" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-gray-900 to-blue-800 text-white rounded-3xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-gray-200 text-sm md:text-base">
            Welcome, {data.admin.name}. Manage users, datasets,
            forecasts, reports, pagination, search, and system analytics.
          </p>
        </div>

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
            <StatCard title="Total Users" value={stats.total_users} color="bg-blue-600" />
            <StatCard title="Admins" value={stats.total_admins} color="bg-indigo-600" />
            <StatCard title="Normal Users" value={stats.total_normal_users} color="bg-green-600" />
            <StatCard title="Datasets" value={stats.total_datasets} color="bg-purple-600" />
            <StatCard title="Forecasts" value={stats.total_forecasts} color="bg-orange-600" />
            <StatCard title="Notifications" value={stats.total_notifications} color="bg-red-600" />
            <StatCard title="Forecast History" value={stats.total_forecast_history || 0} color="bg-teal-600" />
            <StatCard title="Accuracy Metrics" value={stats.total_accuracy_metrics || 0} color="bg-pink-600" />
          </div>
        )}

        {activeTab === "users" && (
          <TableCard title="Manage Users">
            <SearchBox
              value={userSearch}
              setValue={setUserSearch}
              onSearch={handleUserSearch}
              placeholder="Search users by name, email, or role..."
            />

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
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{user.id}</td>
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{user.email}</td>

                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateRole(user.id, e.target.value)
                            }
                            className="border p-2 rounded-lg"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
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

            <Pagination
              page={userPage}
              totalPages={userTotalPages}
              setPage={setUserPage}
            />
          </TableCard>
        )}

        {activeTab === "datasets" && (
          <TableCard title="Manage Datasets">
            <SearchBox
              value={datasetSearch}
              setValue={setDatasetSearch}
              onSearch={handleDatasetSearch}
              placeholder="Search datasets by file name or file path..."
            />

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
                        <td className="p-3 text-sm text-gray-500">
                          {dataset.file_path}
                        </td>

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

            <Pagination
              page={datasetPage}
              totalPages={datasetTotalPages}
              setPage={setDatasetPage}
            />
          </TableCard>
        )}

        {activeTab === "forecasts" && (
          <TableCard title="Monitor Forecasting Activities">
            <SearchBox
              value={forecastSearch}
              setValue={setForecastSearch}
              onSearch={handleForecastSearch}
              placeholder="Search forecasts by product name..."
            />

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

            <Pagination
              page={forecastPage}
              totalPages={forecastTotalPages}
              setPage={setForecastPage}
            />
          </TableCard>
        )}

        {activeTab === "history" && (
          <TableCard title="Forecast History">
            <SearchBox
              value={historySearch}
              setValue={setHistorySearch}
              onSearch={handleHistorySearch}
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
              onSearch={handleMetricsSearch}
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

                    <h3 className="text-xl font-bold">
                      {report.name}
                    </h3>

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
      </div>
    </PageLayout>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-2xl shadow-lg`}>
      <p className="text-sm opacity-90">{title}</p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>
    </div>
  );
}

export default Admin;