import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#9333ea",
    "#f97316",
    "#dc2626",
    "#14b8a6",
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (category) params.append("category", category);
      if (region) params.append("region", region);

      const response = await API.get(
        `/dashboard/forecast-analysis?${params.toString()}`
      );

      setDashboardData(response.data);
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Dashboard API Error"
      );
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCategory("");
    setRegion("");

    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner text="Loading dashboard..." />
      </PageLayout>
    );
  }

  const summary = dashboardData?.summary || {};
  const filters = dashboardData?.filters || {
    categories: [],
    regions: [],
  };

  const productSales = dashboardData?.product_sales || [];
  const regionSales = dashboardData?.region_sales || [];
  const categorySales = dashboardData?.category_sales || [];
  const monthlySales = dashboardData?.monthly_sales || [];
  const forecastVsActual =
    dashboardData?.forecast_vs_actual || [];
  const recentActivity =
    dashboardData?.recent_activity || [];

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl shadow-md p-4 md:p-5"
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            Forecast Dashboard
          </h1>

          <p className="mt-1 text-sm text-blue-100">
            Analyze demand trends with interactive filters and
            advanced analytics charts.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Dashboard Filters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="border p-3 rounded-xl w-full focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="border p-3 rounded-xl w-full focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="border p-3 rounded-xl w-full focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <option value="">All Categories</option>

                {filters.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Region
              </label>

              <select
                value={region}
                onChange={(e) =>
                  setRegion(e.target.value)
                }
                className="border p-3 rounded-xl w-full focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <option value="">All Regions</option>

                {filters.regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end gap-3">
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white rounded-xl font-bold px-4 py-3 hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>

              <button
                onClick={clearFilters}
                className="bg-gray-200 text-gray-700 rounded-xl font-bold px-4 py-3 hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={summary.total_products || 0}
          />

          <StatCard
            title="Total Regions"
            value={summary.total_regions || 0}
          />

          <StatCard
            title="Total Sales"
            value={`₹ ${summary.total_sales || 0}`}
          />

          <StatCard
            title="Top Product"
            value={summary.top_product || "N/A"}
          />
        </div>

        <ChartCard title="Product-wise Sales">
          {productSales.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="grid lg:grid-cols-2 gap-8">
          <ChartCard title="Category-wise Sales">
            {categorySales.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="sales"
                    nameKey="category"
                    outerRadius={120}
                    label
                  >
                    {categorySales.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Region-wise Sales">
            {regionSales.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={regionSales}
                    dataKey="sales"
                    nameKey="region"
                    outerRadius={120}
                    label
                  >
                    {regionSales.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Monthly Sales Trend">
          {monthlySales.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#9333ea"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Forecast vs Actual Sales">
          {forecastVsActual.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={forecastVsActual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="actual"
                  fill="#16a34a"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="forecast"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">
            Recent Forecast Activity
          </h2>

          {recentActivity.length === 0 ? (
            <p className="text-gray-500">
              No recent activity found.
            </p>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">
                    Product
                  </th>
                  <th className="p-3 text-left">
                    Predicted Sales
                  </th>
                  <th className="p-3 text-left">
                    Dataset ID
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentActivity.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">
                      {item.product_name}
                    </td>

                    <td className="p-3">
                      ₹ {item.predicted_sales}
                    </td>

                    <td className="p-3">
                      {item.dataset_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition">
      <p className="text-gray-500">{title}</p>

      <h2 className="text-3xl font-bold mt-2 text-blue-600">
        {value}
      </h2>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-6">
        {title}
      </h2>

      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-500">
      No data available for this chart.
    </div>
  );
}

export default Dashboard;