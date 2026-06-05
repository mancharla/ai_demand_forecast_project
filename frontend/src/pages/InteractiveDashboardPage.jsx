import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
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
  Legend,
} from "recharts";
import { RefreshCw, Filter, BarChart3 } from "lucide-react";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#9333ea"];

function InteractiveDashboardPage() {
  const { projectId } = useParams();

  const [filters, setFilters] = useState({
    region: "",
    category: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    categories: [],
  });

  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [drilldown, setDrilldown] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
    fetchDashboardData();
  }, [projectId]);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await API.get(
        `/dashboard-interactive/filters/${projectId}`
      );
      setFilterOptions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.region) params.region = filters.region;
      if (filters.category) params.category = filters.category;

      const [summaryResponse, chartsResponse, drilldownResponse] =
        await Promise.all([
          API.get(`/dashboard-interactive/summary/${projectId}`, { params }),
          API.get(`/dashboard-interactive/charts/${projectId}`),
          API.get(`/dashboard-interactive/drilldown/${projectId}`, { params }),
        ]);

      setSummary(summaryResponse.data);
      setCharts(chartsResponse.data);
      setDrilldown(drilldownResponse.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      region: "",
      category: "",
    });
  };

  const selectRegion = (region) => {
    setFilters((prev) => ({
      ...prev,
      region,
    }));
  };

  const selectCategory = (category) => {
    setFilters((prev) => ({
      ...prev,
      category,
    }));
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Interactive Analytics
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Drill-down Dashboard
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Cross-filter revenue, category, region and product analytics for
                business decision-making.
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw size={18} />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} />
            <h2 className="text-xl font-bold">Global Filters</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={filters.region}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  region: e.target.value,
                })
              }
              className="rounded-xl border px-4 py-3"
            >
              <option value="">All Regions</option>

              {filterOptions.regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value,
                })
              }
              className="rounded-xl border px-4 py-3"
            >
              <option value="">All Categories</option>

              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {(filters.region || filters.category) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.region && (
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  Region: {filters.region}
                </span>
              )}

              {filters.category && (
                <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                  Category: {filters.category}
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow">
            Loading analytics...
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-4">
              <KpiCard
                title="Revenue"
                value={`₹${Number(summary?.revenue || 0).toLocaleString()}`}
              />
              <KpiCard
                title="Profit"
                value={`₹${Number(summary?.profit || 0).toLocaleString()}`}
              />
              <KpiCard
                title="Cost"
                value={`₹${Number(summary?.cost || 0).toLocaleString()}`}
              />
              <KpiCard
                title="Growth Rate"
                value={`${summary?.growth_rate || 0}%`}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="text-xl font-bold">Revenue by Region</h2>
                <p className="text-sm text-slate-500">
                  Click a region bar to filter dashboard.
                </p>

                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={330}>
                    <BarChart data={charts?.region_sales || []}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[10, 10, 0, 0]}
                        onClick={(data) => selectRegion(data.name)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="text-xl font-bold">Sales by Category</h2>
                <p className="text-sm text-slate-500">
                  Click a category slice to filter dashboard.
                </p>

                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={330}>
                    <PieChart>
                      <Pie
                        data={charts?.category_sales || []}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                        onClick={(data) => selectCategory(data.name)}
                      >
                        {(charts?.category_sales || []).map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={20} />
                <h2 className="text-xl font-bold">Drill-down Data</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Region</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Forecast Sales</th>
                      <th className="p-3 text-left">Revenue</th>
                    </tr>
                  </thead>

                  <tbody>
                    {drilldown.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-slate-500"
                        >
                          No drill-down data found.
                        </td>
                      </tr>
                    ) : (
                      drilldown.map((row, index) => (
                        <tr key={index} className="border-t hover:bg-slate-50">
                          <td className="p-3">{row.product}</td>
                          <td className="p-3">{row.region}</td>
                          <td className="p-3">{row.category}</td>
                          <td className="p-3">{row.forecast_sales}</td>
                          <td className="p-3">
                            ₹{Number(row.revenue || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-extrabold text-slate-900">{value}</h3>
    </div>
  );
}

export default InteractiveDashboardPage;