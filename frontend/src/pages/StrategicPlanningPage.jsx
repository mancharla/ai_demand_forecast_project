import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

function StrategicPlanningPage() {
  const [dashboard, setDashboard] = useState(null);
  const [targets, setTargets] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [formData, setFormData] = useState({
    project_id: "",
    organization_id: "",
    target_name: "",
    target_type: "revenue",
    target_period: "annual",
    target_value: "",
    actual_value: "",
    forecast_value: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, targetsRes, recommendationsRes] =
        await Promise.all([
          API.get("/strategic-planning/dashboard"),
          API.get("/strategic-planning/targets"),
          API.get("/strategic-planning/recommendations"),
        ]);

      setDashboard(dashboardRes.data);
      setTargets(targetsRes.data || []);
      setRecommendations(recommendationsRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createTarget = async () => {
    try {
      await API.post("/strategic-planning/targets", {
        ...formData,
        project_id: formData.project_id
          ? Number(formData.project_id)
          : null,
        organization_id: formData.organization_id
          ? Number(formData.organization_id)
          : null,
        target_value: Number(formData.target_value),
        actual_value: Number(formData.actual_value || 0),
        forecast_value: Number(formData.forecast_value || 0),
      });

      setFormData({
        project_id: "",
        organization_id: "",
        target_name: "",
        target_type: "revenue",
        target_period: "annual",
        target_value: "",
        actual_value: "",
        forecast_value: "",
      });

      fetchData();
      alert("Business target created");
    } catch (error) {
      console.error(error);
      alert("Failed to create target");
    }
  };

  const statusColor = (status) => {
    if (status === "achieved")
      return "bg-green-100 text-green-700";
    if (status === "at_risk")
      return "bg-yellow-100 text-yellow-700";
    if (status === "missed")
      return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
            Strategic Planning
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Annual & Quarterly Planning
          </h1>

          <p className="mt-3 text-emerald-100">
            Track business targets, forecast performance,
            achievement rates, and planning recommendations.
          </p>
        </div>

        {dashboard && (
          <div className="grid gap-5 md:grid-cols-5">
            <StatCard
              title="Targets"
              value={dashboard.total_targets}
              icon={<Target size={20} />}
            />

            <StatCard
              title="Achieved"
              value={dashboard.achieved}
              icon={<CheckCircle size={20} />}
            />

            <StatCard
              title="On Track"
              value={dashboard.on_track}
              icon={<TrendingUp size={20} />}
            />

            <StatCard
              title="At Risk"
              value={dashboard.at_risk}
              icon={<AlertTriangle size={20} />}
            />

            <StatCard
              title="Achievement"
              value={`${dashboard.achievement_rate}%`}
              icon={<Target size={20} />}
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={20} />
              <h2 className="text-xl font-bold">
                Create Business Target
              </h2>
            </div>

            <div className="space-y-4">

              <input
                placeholder="Target Name"
                value={formData.target_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={formData.target_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="revenue">Revenue</option>
                <option value="profit">Profit</option>
                <option value="demand">Demand</option>
                <option value="cost">Cost</option>
              </select>

              <select
                value={formData.target_period}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_period: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
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
                placeholder="Actual Value"
                value={formData.actual_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actual_value: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="number"
                placeholder="Forecast Value"
                value={formData.forecast_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    forecast_value: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={createTarget}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
              >
                Create Target
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Business Targets
              </h2>

              <button
                onClick={fetchData}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="rounded-2xl border bg-slate-50 p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-bold">
                      {target.target_name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${statusColor(
                        target.status
                      )}`}
                    >
                      {target.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {target.target_type} • {target.target_period}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="font-semibold">
                        Target
                      </p>
                      <p>{target.target_value}</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        Actual
                      </p>
                      <p>{target.actual_value}</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        Forecast
                      </p>
                      <p>{target.forecast_value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            Planning Recommendations
          </h2>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border bg-slate-50 p-5"
              >
                <div className="flex justify-between">
                  <h3 className="font-bold">
                    {rec.title}
                  </h3>

                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                    {rec.priority}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}

function StatCard({ title, value, icon }) {
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

        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StrategicPlanningPage;