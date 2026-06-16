import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Target,
} from "lucide-react";

function ExecutiveCommandCenterPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, alertsRes, performanceRes] =
        await Promise.all([
          API.get("/executive-command-center/summary"),
          API.get("/executive-command-center/alerts"),
          API.get("/executive-command-center/performance-summary"),
        ]);

      setSummary(summaryRes.data);
      setAlerts(alertsRes.data || []);
      setPerformance(performanceRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const alertColor = (severity) => {
    if (severity === "High")
      return "bg-red-100 text-red-700";

    if (severity === "Medium")
      return "bg-yellow-100 text-yellow-700";

    return "bg-green-100 text-green-700";
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Executive Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Executive Command Center
          </h1>

          <p className="mt-3 text-blue-100">
            Organization-wide forecasting intelligence,
            KPI health, planning performance,
            governance status, and executive alerts.
          </p>
        </div>

        {summary && (
          <div className="grid gap-5 md:grid-cols-5">

            <Card
              title="Health Score"
              value={`${summary.executive_health_score}%`}
              icon={<ShieldCheck size={22} />}
            />

            <Card
              title="Forecasts"
              value={summary.forecasts_count}
              icon={<TrendingUp size={22} />}
            />

            <Card
              title="Targets"
              value={summary.business_targets}
              icon={<Target size={22} />}
            />

            <Card
              title="KPIs"
              value={summary.custom_kpis}
              icon={<Building2 size={22} />}
            />

            <Card
              title="Data Quality"
              value={`${summary.average_data_quality}%`}
              icon={<ShieldCheck size={22} />}
            />

          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">

          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Executive Alerts
              </h2>

              <button
                onClick={loadData}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-4">

              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="rounded-2xl border bg-slate-50 p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-bold">
                      {alert.type}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${alertColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {alert.message}
                  </p>
                </div>
              ))}

            </div>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Strategic Performance
            </h2>

            {performance && (
              <div className="space-y-5">

                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="font-bold mb-3">
                    Target Status
                  </h3>

                  <div className="space-y-2">
                    <p>
                      Achieved:
                      <strong>
                        {" "}
                        {performance.target_status?.achieved}
                      </strong>
                    </p>

                    <p>
                      On Track:
                      <strong>
                        {" "}
                        {performance.target_status?.on_track}
                      </strong>
                    </p>

                    <p>
                      At Risk:
                      <strong>
                        {" "}
                        {performance.target_status?.at_risk}
                      </strong>
                    </p>

                    <p>
                      Missed:
                      <strong>
                        {" "}
                        {performance.target_status?.missed}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="font-bold mb-3">
                    KPI Health
                  </h3>

                  <div className="space-y-2">
                    <p>
                      Healthy:
                      <strong>
                        {" "}
                        {performance.kpi_status?.healthy}
                      </strong>
                    </p>

                    <p>
                      Alerts:
                      <strong>
                        {" "}
                        {performance.kpi_status?.alert}
                      </strong>
                    </p>
                  </div>
                </div>

                {summary && (
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <h3 className="font-bold mb-3">
                      Executive Overview
                    </h3>

                    <div className="space-y-2 text-sm">

                      <p>
                        Pending Approvals:
                        <strong>
                          {" "}
                          {summary.pending_approvals}
                        </strong>
                      </p>

                      <p>
                        Approved Forecasts:
                        <strong>
                          {" "}
                          {summary.approved_forecasts}
                        </strong>
                      </p>

                      <p>
                        KPI Alerts:
                        <strong>
                          {" "}
                          {summary.kpi_alerts}
                        </strong>
                      </p>

                      <p>
                        Achievement Rate:
                        <strong>
                          {" "}
                          {summary.target_achievement_rate}%
                        </strong>
                      </p>

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </PageLayout>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {value}
          </h3>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveCommandCenterPage;