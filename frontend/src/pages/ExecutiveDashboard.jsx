import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import { getExecutiveOverview } from "../api/phase3Api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

const chartColors = [
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#14b8a6",
];

function ExecutiveDashboard() {
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const projectIdFromQuery = Number(searchParams.get("project_id")) || null;
    fetchProjects(projectIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchOverview(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async (initialProjectId = null) => {
    try {
      setLoading(true);

      const response = await API.get("/projects");
      const projectList = response.data || [];

      setProjects(projectList);

      if (projectList.length > 0) {
        const foundProject = initialProjectId
          ? projectList.find((project) => project.id === initialProjectId)
          : null;

        setSelectedProjectId(
          foundProject ? foundProject.id : projectList[0].id
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load projects.");
      setLoading(false);
    }
  };

  const fetchOverview = async (projectId) => {
    try {
      setLoading(true);

      const response = await getExecutiveOverview(projectId);

      setOverview(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setOverview(null);
      setError(
        err.response?.data?.detail || "Failed to load executive dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const changeProject = (event) => {
    setSelectedProjectId(Number(event.target.value));
  };

  const refreshDashboard = () => {
    if (selectedProjectId) {
      fetchOverview(selectedProjectId);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹ 0";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "0%";
    return `${Number(value || 0).toFixed(1)}%`;
  };

  const selectedProjectName =
    projects.find((project) => project.id === selectedProjectId)?.name ||
    "Choose Project";

  const revenueForecast = overview?.revenue_forecast || {};
  const profitAnalysis = overview?.profit_analysis || {};
  const costAnalysis = overview?.cost_analysis || {};
  const kpiSummary = overview?.kpi_summary || {};

  const costBreakdown = costAnalysis?.cost_by_category || [];
  const regionBreakdown = costAnalysis?.cost_by_region || [];
  const keyFindings = costAnalysis?.key_findings || [];

  const revenueDelta =
    Number(revenueForecast.forecast_revenue || 0) -
    Number(revenueForecast.actual_revenue || 0);

  const revenueProfitData = [
    {
      name: "Actual",
      Revenue: Number(revenueForecast.actual_revenue || 0),
      Profit: Number(profitAnalysis.actual_profit || 0),
    },
    {
      name: "Forecast",
      Revenue: Number(revenueForecast.forecast_revenue || 0),
      Profit: Number(profitAnalysis.forecast_profit || 0),
    },
  ];

  const businessHealthScore = calculateHealthScore(
    revenueForecast,
    profitAnalysis
  );

  return (
    <PageLayout>
      <div className="space-y-8 text-gray-900 dark:text-white">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-blue-100">
                Business Intelligence
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Executive Business Dashboard
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Revenue forecasting, profit analytics, cost insights, KPI
                monitoring, and strategic business decision support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedProjectId || ""}
                onChange={changeProject}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-white outline-none backdrop-blur"
              >
                <option className="text-black" value="" disabled>
                  Choose Project
                </option>

                {projects.map((project) => (
                  <option
                    className="text-black"
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <button
                onClick={refreshDashboard}
                className="rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 shadow hover:bg-blue-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <HeroMiniCard title="Selected Project" value={selectedProjectName} />
            <HeroMiniCard
              title="Projects"
              value={projects.length}
            />
            <HeroMiniCard
              title="Business Health"
              value={`${businessHealthScore}/100`}
            />
            <HeroMiniCard
              title="Revenue Growth"
              value={formatPercent(revenueForecast.variance_percentage)}
            />
          </div>
        </div>

        {loading ? (
          <StateCard message="Loading executive analytics..." />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : !overview ? (
          <StateCard message="No executive insights available for the selected project." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ExecutiveCard
                icon="💰"
                title="Actual Revenue"
                value={formatCurrency(revenueForecast.actual_revenue)}
                note="Current business revenue"
                color="from-blue-500 to-cyan-500"
              />

              <ExecutiveCard
                icon="📈"
                title="Forecast Revenue"
                value={formatCurrency(revenueForecast.forecast_revenue)}
                note="Projected revenue"
                color="from-indigo-500 to-purple-500"
              />

              <ExecutiveCard
                icon="🏦"
                title="Actual Profit"
                value={formatCurrency(profitAnalysis.actual_profit)}
                note="Current profit value"
                color="from-emerald-500 to-green-500"
              />

              <ExecutiveCard
                icon="🚀"
                title="Forecast Profit"
                value={formatCurrency(profitAnalysis.forecast_profit)}
                note="Projected profitability"
                color="from-orange-500 to-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ExecutiveCard
                icon="📊"
                title="Revenue Delta"
                value={formatCurrency(revenueDelta)}
                note="Forecast minus actual"
                color="from-sky-500 to-blue-600"
              />

              <ExecutiveCard
                icon="📌"
                title="Forecast Margin"
                value={formatPercent(
                  profitAnalysis.forecast_margin_percentage
                )}
                note="Projected margin"
                color="from-purple-500 to-pink-500"
              />

              <ExecutiveCard
                icon="🏆"
                title="Top Product"
                value={kpiSummary.top_product || "N/A"}
                note="Highest demand product"
                color="from-yellow-500 to-orange-500"
              />

              <ExecutiveCard
                icon="✅"
                title="Inventory Health"
                value={kpiSummary.inventory_health || "N/A"}
                note="Operational readiness"
                color="from-teal-500 to-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-7">
              <ChartCard
                className="xl:col-span-4"
                title="Revenue vs Profit Comparison"
                subtitle="Actual and forecasted business performance"
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueProfitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar
                      dataKey="Revenue"
                      fill="#2563eb"
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      dataKey="Profit"
                      fill="#16a34a"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                className="xl:col-span-3"
                title="Cost by Category"
                subtitle="Category-wise cost distribution"
              >
                {costBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        dataKey="cost"
                        nameKey="category"
                        outerRadius={115}
                        label
                      >
                        {costBreakdown.map((item, index) => (
                          <Cell
                            key={index}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyText message="No category cost data available." />
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartCard
                title="Regional Cost Analysis"
                subtitle="Cost distribution across regions"
              >
                {regionBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={330}>
                    <BarChart data={regionBreakdown.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar
                        dataKey="cost"
                        fill="#7c3aed"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyText message="No regional cost data available." />
                )}
              </ChartCard>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-bold">AI Executive Insights</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Recommended business actions based on revenue, profit, cost,
                  and forecast impact.
                </p>

                <div className="mt-6 space-y-4">
                  <InsightItem
                    icon="📈"
                    title="Revenue Opportunity"
                    text={`Forecast revenue is ${formatCurrency(
                      revenueForecast.forecast_revenue
                    )}. Track high-demand products and allocate stock early.`}
                  />

                  <InsightItem
                    icon="💰"
                    title="Profit Focus"
                    text={`Forecast margin is ${formatPercent(
                      profitAnalysis.forecast_margin_percentage
                    )}. Prioritize high-profit categories.`}
                  />

                  <InsightItem
                    icon="⚠️"
                    title="Cost Control"
                    text="Review category and region cost distribution to reduce unnecessary spending."
                  />

                  <InsightItem
                    icon="🚀"
                    title="Growth Strategy"
                    text="Use forecasted demand to plan purchasing, inventory, and regional expansion."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Key Findings</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Management-level observations for decision making.
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {kpiSummary.kpis?.length || 0} KPIs Tracked
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {keyFindings.length > 0 ? (
                  keyFindings.map((finding, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {finding}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <Finding text="Generate KPIs to view business findings." />
                    <Finding text="Upload enterprise dataset with Sales, Profit, Quantity, and Region columns." />
                    <Finding text="Run revenue and profit forecasting to unlock executive insights." />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function HeroMiniCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
        {title}
      </p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function ExecutiveCard({ icon, title, value, note, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {note}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-xl text-white shadow`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function InsightItem({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function Finding({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </div>
  );
}

function StateCard({ message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
      {message}
    </div>
  );
}

function EmptyText({ message }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-300">
      {message}
    </div>
  );
}

function calculateHealthScore(revenueForecast, profitAnalysis) {
  const revenueGrowth = Number(revenueForecast?.variance_percentage || 0);
  const margin = Number(profitAnalysis?.forecast_margin_percentage || 0);

  let score = 70;

  if (revenueGrowth > 0) score += 10;
  if (revenueGrowth > 10) score += 5;
  if (margin > 10) score += 10;
  if (margin > 20) score += 5;

  return Math.max(0, Math.min(100, score));
}

export default ExecutiveDashboard;