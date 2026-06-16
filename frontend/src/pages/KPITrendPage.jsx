import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
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
import { TrendingUp, RefreshCw, BarChart3 } from "lucide-react";

function KPITrendPage() {
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState("");
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    const res = await API.get("/kpi-management/list");
    setKpis(res.data || []);
  };

  const fetchTrend = async () => {
    if (!selectedKpi) {
      alert("Select KPI");
      return;
    }

    const res = await API.get(`/kpi-management/${selectedKpi}/trend`);
    setTrendData(res.data || []);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            KPI Trend Analytics
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            KPI Forecast vs Actual Trends
          </h1>

          <p className="mt-3 text-blue-100">
            Track KPI performance trends and compare actual values against
            forecasted values.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row">
            <select
              value={selectedKpi}
              onChange={(e) => setSelectedKpi(e.target.value)}
              className="flex-1 rounded-xl border px-4 py-3"
            >
              <option value="">Select KPI</option>

              {kpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  #{kpi.id} - {kpi.kpi_name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchTrend}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
            >
              <RefreshCw size={18} />
              Load Trend
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Trend Points" value={trendData.length} />
          <Card
            title="Latest Actual"
            value={
              trendData.length
                ? trendData[trendData.length - 1].actual
                : 0
            }
          />
          <Card
            title="Latest Forecast"
            value={
              trendData.length
                ? trendData[trendData.length - 1].forecast
                : 0
            }
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp size={20} />
            <h2 className="text-xl font-bold">
              Actual vs Forecast Trend
            </h2>
          </div>

          {trendData.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
              Select a KPI and load trend data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={3}
                  name="Actual"
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#16a34a"
                  strokeWidth={3}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold">{value}</h3>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          <BarChart3 size={22} />
        </div>
      </div>
    </div>
  );
}

export default KPITrendPage;