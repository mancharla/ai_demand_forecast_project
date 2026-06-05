import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  HeartPulse,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
  IndianRupee,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

function BusinessHealthPage() {
  const { projectId } = useParams();

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBusinessHealth();
  }, [projectId]);

  const fetchBusinessHealth = async () => {
    try {
      setLoading(true);

      const [summaryRes, trendsRes, risksRes] = await Promise.all([
        API.get(`/business-health/project/${projectId}`),
        API.get(`/business-health/kpi-trends/${projectId}`),
        API.get(`/business-health/risks/${projectId}`),
      ]);

      setSummary(summaryRes.data);
      setTrends(trendsRes.data || []);
      setRisks(risksRes.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load business health data");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-700 bg-red-100";
    if (risk === "Medium") return "text-yellow-700 bg-yellow-100";
    return "text-green-700 bg-green-100";
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
                Business Intelligence
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Business Health Monitor
              </h1>

              <p className="mt-3 max-w-3xl text-emerald-100">
                Track revenue growth, profit margin, forecast accuracy,
                business risks, and AI-based health indicators.
              </p>
            </div>

            <button
              onClick={fetchBusinessHealth}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-teal-700 hover:bg-teal-50"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow">
            Loading business health...
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-5">
              <KpiCard
                title="Health Score"
                value={`${summary?.health_score || 0}%`}
                icon={<HeartPulse size={24} />}
              />

              <KpiCard
                title="Revenue"
                value={`₹${Number(summary?.total_revenue || 0).toLocaleString()}`}
                icon={<IndianRupee size={24} />}
              />

              <KpiCard
                title="Profit Margin"
                value={`${summary?.profit_margin || 0}%`}
                icon={<TrendingUp size={24} />}
              />

              <KpiCard
                title="Accuracy"
                value={`${summary?.forecast_accuracy || 0}%`}
                icon={<Target size={24} />}
              />

              <div className="rounded-3xl bg-white p-6 shadow">
                <p className="text-sm font-semibold text-slate-500">
                  Risk Level
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <ShieldAlert size={26} />

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold ${getRiskColor(
                      summary?.risk_level
                    )}`}
                  >
                    {summary?.risk_level || "Low"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold">Revenue & Profit Trends</h2>

              <p className="mt-1 text-sm text-slate-500">
                Monthly trend of revenue and profit performance.
              </p>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={3}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#16a34a"
                      strokeWidth={3}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold">Risk Analysis</h2>

              <p className="mt-1 text-sm text-slate-500">
                AI-detected business risks and recommended actions.
              </p>

              <div className="mt-6 grid gap-4">
                {risks.map((risk, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-bold">{risk.type}</h3>

                        <p className="mt-2 text-sm text-slate-600">
                          {risk.description}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold ${getRiskColor(
                          risk.severity
                        )}`}
                      >
                        {risk.severity}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">
                        Recommended Action
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {risk.recommended_action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
            {value}
          </h3>
        </div>

        <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default BusinessHealthPage;