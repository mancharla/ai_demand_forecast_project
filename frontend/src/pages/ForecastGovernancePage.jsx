import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  ShieldCheck,
  FileClock,
  RefreshCw,
  Plus,
  GitBranch,
  ClipboardList,
} from "lucide-react";

function ForecastGovernancePage() {
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [lifecycle, setLifecycle] = useState(null);

  const [formData, setFormData] = useState({
    forecast_id: "",
    organization_id: "",
    lifecycle_stage: "draft",
    change_type: "created",
    change_summary: "",
  });

  const [selectedForecastId, setSelectedForecastId] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/forecast-governance/dashboard");
      setDashboard(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const createRecord = async () => {
    if (!formData.forecast_id) {
      alert("Forecast ID required");
      return;
    }

    try {
      await API.post("/forecast-governance/records", {
        forecast_id: Number(formData.forecast_id),
        organization_id: formData.organization_id
          ? Number(formData.organization_id)
          : null,
        lifecycle_stage: formData.lifecycle_stage,
        change_type: formData.change_type,
        change_summary: formData.change_summary,
      });

      setFormData({
        forecast_id: "",
        organization_id: "",
        lifecycle_stage: "draft",
        change_type: "created",
        change_summary: "",
      });

      fetchDashboard();
      alert("Governance record created");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to create record");
    }
  };

  const fetchForecastRecords = async () => {
    if (!selectedForecastId) {
      alert("Enter Forecast ID");
      return;
    }

    try {
      const [recordsRes, lifecycleRes] = await Promise.all([
        API.get(`/forecast-governance/records/${selectedForecastId}`),
        API.get(`/forecast-governance/lifecycle/${selectedForecastId}`),
      ]);

      setRecords(recordsRes.data || []);
      setLifecycle(lifecycleRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateLifecycle = async (stage) => {
    if (!selectedForecastId) {
      alert("Enter Forecast ID first");
      return;
    }

    try {
      await API.put(`/forecast-governance/lifecycle/${selectedForecastId}`, {
        current_stage: stage,
        change_summary: `Lifecycle updated to ${stage}`,
      });

      fetchForecastRecords();
      fetchDashboard();
    } catch (error) {
      console.error(error);
      alert("Failed to update lifecycle");
    }
  };

  const statusColor = (stage) => {
    if (stage === "approved") return "bg-green-100 text-green-700";
    if (stage === "rejected") return "bg-red-100 text-red-700";
    if (stage === "submitted") return "bg-yellow-100 text-yellow-700";
    if (stage === "archived") return "bg-slate-200 text-slate-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Forecast Governance
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Forecast Governance Center
          </h1>

          <p className="mt-3 max-w-3xl text-blue-100">
            Track forecast lifecycle, versions, approval records, modifications,
            and enterprise governance history.
          </p>
        </div>

        {dashboard && (
          <div className="grid gap-5 md:grid-cols-6">
            <StatCard title="Tracked" value={dashboard.total_forecasts_tracked} />
            <StatCard title="Draft" value={dashboard.draft} />
            <StatCard title="Submitted" value={dashboard.submitted} />
            <StatCard title="Approved" value={dashboard.approved} />
            <StatCard title="Rejected" value={dashboard.rejected} />
            <StatCard title="Pending" value={dashboard.pending_approvals} />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={20} />
              <h2 className="text-xl font-bold">Create Governance Record</h2>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Forecast ID"
                value={formData.forecast_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    forecast_id: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="number"
                placeholder="Organization ID optional"
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organization_id: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={formData.lifecycle_stage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lifecycle_stage: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={formData.change_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    change_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>

              <textarea
                placeholder="Change summary"
                rows="4"
                value={formData.change_summary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    change_summary: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={createRecord}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                Save Governance Record
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} />
                <h2 className="text-xl font-bold">Forecast Lifecycle</h2>
              </div>

              <button
                onClick={fetchDashboard}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="mb-5 flex gap-3">
              <input
                type="number"
                placeholder="Enter Forecast ID"
                value={selectedForecastId}
                onChange={(e) => setSelectedForecastId(e.target.value)}
                className="flex-1 rounded-xl border px-4 py-3"
              />

              <button
                onClick={fetchForecastRecords}
                className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
              >
                Load
              </button>
            </div>

            {lifecycle && (
              <div className="mb-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Current Lifecycle</p>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold ${statusColor(
                      lifecycle.current_stage
                    )}`}
                  >
                    {lifecycle.current_stage}
                  </span>

                  <span className="font-bold">
                    Version {lifecycle.current_version}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
              {["draft", "submitted", "approved", "rejected", "archived"].map(
                (stage) => (
                  <button
                    key={stage}
                    onClick={() => updateLifecycle(stage)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${statusColor(
                      stage
                    )}`}
                  >
                    {stage}
                  </button>
                )
              )}
            </div>

            <h3 className="mb-4 font-bold">Governance Records</h3>

            {records.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                No governance records loaded.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">
                        Version {record.version_number}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(
                          record.lifecycle_stage
                        )}`}
                      >
                        {record.lifecycle_stage}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {record.change_summary || "No summary"}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      Changed by User #{record.changed_by}
                    </p>

                    <p className="text-xs text-slate-400">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center gap-2">
            <ClipboardList size={20} />
            <h2 className="text-xl font-bold">Governance Capabilities</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={<GitBranch size={22} />}
              title="Version Control"
              text="Each forecast modification creates a new governance version."
            />
            <InfoCard
              icon={<FileClock size={22} />}
              title="Lifecycle Tracking"
              text="Forecasts move through draft, submitted, approved, rejected and archived stages."
            />
            <InfoCard
              icon={<ShieldCheck size={22} />}
              title="Audit Trail"
              text="All changes are tracked with user, timestamp, stage and change summary."
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-extrabold">{value || 0}</h3>
    </div>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="mb-3 text-blue-700">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}

export default ForecastGovernancePage;