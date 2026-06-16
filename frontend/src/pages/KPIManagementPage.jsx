import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  BarChart3,
  Plus,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

function KPIManagementPage() {
  const [dashboard, setDashboard] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    organization_id: "",
    project_id: "",
    kpi_name: "",
    kpi_type: "revenue",
    target_value: "",
    current_value: "",
    alert_threshold: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, kpisRes] = await Promise.all([
        API.get("/kpi-management/dashboard"),
        API.get("/kpi-management/list"),
      ]);

      setDashboard(dashboardRes.data);
      setKpis(kpisRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createKPI = async () => {
    if (!formData.kpi_name.trim()) {
      alert("KPI name required");
      return;
    }

    try {
      await API.post("/kpi-management/create", {
        organization_id: formData.organization_id
          ? Number(formData.organization_id)
          : null,
        project_id: formData.project_id
          ? Number(formData.project_id)
          : null,
        kpi_name: formData.kpi_name,
        kpi_type: formData.kpi_type,
        target_value: Number(formData.target_value || 0),
        current_value: Number(formData.current_value || 0),
        alert_threshold: Number(formData.alert_threshold || 0),
      });

      setFormData({
        organization_id: "",
        project_id: "",
        kpi_name: "",
        kpi_type: "revenue",
        target_value: "",
        current_value: "",
        alert_threshold: "",
      });

      fetchData();
      alert("KPI created successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to create KPI");
    }
  };

  const fetchHistory = async (kpiId) => {
    try {
      const res = await API.get(`/kpi-management/${kpiId}/history`);
      setHistory(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getKpiStatus = (kpi) => {
    if (Number(kpi.current_value || 0) < Number(kpi.alert_threshold || 0)) {
      return "alert";
    }

    return "healthy";
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Advanced KPI Management
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            KPI Performance Center
          </h1>

          <p className="mt-3 max-w-3xl text-blue-100">
            Create custom KPIs, track performance against forecasts, monitor
            thresholds, and review KPI health.
          </p>
        </div>

        {dashboard && (
          <div className="grid gap-5 md:grid-cols-3">
            <StatCard
              title="Total KPIs"
              value={dashboard.total_kpis}
              icon={<BarChart3 size={22} />}
            />

            <StatCard
              title="Healthy KPIs"
              value={dashboard.healthy_count}
              icon={<CheckCircle size={22} />}
            />

            <StatCard
              title="Alerts"
              value={dashboard.alert_count}
              icon={<AlertTriangle size={22} />}
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={20} />
              <h2 className="text-xl font-bold">Create Custom KPI</h2>
            </div>

            <div className="space-y-4">
              <input
                placeholder="KPI Name"
                value={formData.kpi_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kpi_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={formData.kpi_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kpi_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="revenue">Revenue</option>
                <option value="profit">Profit</option>
                <option value="demand">Demand</option>
                <option value="cost">Cost</option>
                <option value="accuracy">Forecast Accuracy</option>
              </select>

              <input
                type="number"
                placeholder="Target Value"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_value: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="number"
                placeholder="Current Value"
                value={formData.current_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_value: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="number"
                placeholder="Alert Threshold"
                value={formData.alert_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alert_threshold: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={createKPI}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Create KPI
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">KPI Library</h2>

              <button
                onClick={fetchData}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {kpis.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                No KPIs created.
              </div>
            ) : (
              <div className="space-y-4">
                {kpis.map((kpi) => {
                  const status = getKpiStatus(kpi);

                  return (
                    <div
                      key={kpi.id}
                      className="rounded-2xl border bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-bold">{kpi.kpi_name}</h3>
                          <p className="text-sm text-slate-500">
                            {kpi.kpi_type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            status === "alert"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <Info label="Target" value={kpi.target_value} />
                        <Info label="Current" value={kpi.current_value} />
                        <Info
                          label="Threshold"
                          value={kpi.alert_threshold}
                        />
                      </div>

                      <button
                        onClick={() => fetchHistory(kpi.id)}
                        className="mt-4 flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 font-semibold"
                      >
                        <Activity size={16} />
                        View History
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">KPI Performance History</h2>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              Select a KPI to view history.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold">Value: {item.metric_value}</p>
                  <p className="text-sm text-slate-500">
                    {item.notes || "No notes"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold">{value || 0}</h3>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

export default KPIManagementPage;