import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Building2,
  CheckCircle,
  Workflow,
  Target,
  ShieldCheck,
  BarChart3,
  Database,
  Bell,
  FileText,
  Activity,
  RefreshCw,
} from "lucide-react";

function EnterpriseDashboardPage() {
  const [data, setData] = useState({
    organizations: [],
    approvals: [],
    workflows: [],
    strategic: null,
    governance: null,
    kpi: null,
    quality: null,
    executive: null,
    notifications: [],
    audit: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEnterpriseData();
  }, []);

  const loadEnterpriseData = async () => {
    try {
      setLoading(true);

      const [
        organizationsRes,
        approvalsRes,
        workflowsRes,
        strategicRes,
        governanceRes,
        kpiRes,
        qualityRes,
        executiveRes,
        notificationsRes,
        auditRes,
      ] = await Promise.all([
        API.get("/organizations/my-organizations"),
        API.get("/forecast-approvals/pending"),
        API.get("/workflows/my-workflows"),
        API.get("/strategic-planning/dashboard"),
        API.get("/forecast-governance/dashboard"),
        API.get("/kpi-management/dashboard"),
        API.get("/data-quality/dashboard"),
        API.get("/executive-command-center/summary"),
        API.get("/notification-center/notifications"),
        API.get("/audit-logs/summary"),
      ]);

      setData({
        organizations: organizationsRes.data || [],
        approvals: approvalsRes.data || [],
        workflows: workflowsRes.data || [],
        strategic: strategicRes.data,
        governance: governanceRes.data,
        kpi: kpiRes.data,
        quality: qualityRes.data,
        executive: executiveRes.data,
        notifications: notificationsRes.data || [],
        audit: auditRes.data,
      });
    } catch (error) {
      console.error("Enterprise dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadNotifications = data.notifications.filter(
    (item) => item.is_read === 0 || item.is_read === false
  ).length;

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Enterprise Forecasting Ecosystem
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Enterprise Dashboard
              </h1>

              <p className="mt-3 max-w-4xl text-blue-100">
                Unified command dashboard for organizations, approvals,
                workflows, strategic planning, governance, KPI health,
                data quality, notifications, and audit monitoring.
              </p>
            </div>

            <button
              onClick={loadEnterpriseData}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-800 hover:bg-blue-50"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow">
            Loading enterprise dashboard...
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-4 xl:grid-cols-5">
              <MetricCard
                title="Organizations"
                value={data.organizations.length}
                icon={<Building2 size={22} />}
                path="/organizations"
              />

              <MetricCard
                title="Pending Approvals"
                value={data.approvals.length}
                icon={<CheckCircle size={22} />}
                path="/forecast-approvals"
              />

              <MetricCard
                title="Workflows"
                value={data.workflows.length}
                icon={<Workflow size={22} />}
                path="/workflow-automation"
              />

              <MetricCard
                title="Executive Health"
                value={`${data.executive?.executive_health_score || 0}%`}
                icon={<ShieldCheck size={22} />}
                path="/executive-command-center"
              />

              <MetricCard
                title="Unread Alerts"
                value={unreadNotifications}
                icon={<Bell size={22} />}
                path="/notification-center"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 text-xl font-bold">
                  Enterprise Performance Summary
                </h2>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <InfoTile
                    title="Strategic Targets"
                    value={data.strategic?.total_targets || 0}
                    icon={<Target size={20} />}
                    path="/strategic-planning"
                  />

                  <InfoTile
                    title="Achievement Rate"
                    value={`${data.strategic?.achievement_rate || 0}%`}
                    icon={<BarChart3 size={20} />}
                    path="/strategic-planning"
                  />

                  <InfoTile
                    title="Forecasts Tracked"
                    value={data.governance?.total_forecasts_tracked || 0}
                    icon={<ShieldCheck size={20} />}
                    path="/forecast-governance"
                  />

                  <InfoTile
                    title="KPI Alerts"
                    value={data.kpi?.alert_count || 0}
                    icon={<BarChart3 size={20} />}
                    path="/kpi-management"
                  />

                  <InfoTile
                    title="Data Quality"
                    value={`${data.quality?.average_score || 0}%`}
                    icon={<Database size={20} />}
                    path="/data-quality"
                  />

                  <InfoTile
                    title="Audit Logs"
                    value={data.audit?.total_logs || 0}
                    icon={<Activity size={20} />}
                    path="/audit-logs"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 text-xl font-bold">
                  Governance Snapshot
                </h2>

                <div className="space-y-4">
                  <StatusRow
                    label="Draft"
                    value={data.governance?.draft || 0}
                  />
                  <StatusRow
                    label="Submitted"
                    value={data.governance?.submitted || 0}
                  />
                  <StatusRow
                    label="Approved"
                    value={data.governance?.approved || 0}
                  />
                  <StatusRow
                    label="Rejected"
                    value={data.governance?.rejected || 0}
                  />
                  <StatusRow
                    label="Archived"
                    value={data.governance?.archived || 0}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <ModuleCard
                title="Organization Management"
                description="Manage companies, members, roles, and organization-specific settings."
                icon={<Building2 size={26} />}
                path="/organizations"
              />

              <ModuleCard
                title="Forecast Approval Workflow"
                description="Review, approve, reject, and track forecast approval lifecycle."
                icon={<CheckCircle size={26} />}
                path="/forecast-approvals"
              />

              <ModuleCard
                title="Workflow Automation"
                description="Automate forecast generation, reports, notifications, and execution logs."
                icon={<Workflow size={26} />}
                path="/workflow-automation"
              />

              <ModuleCard
                title="Strategic Planning"
                description="Track annual and quarterly targets, forecast gaps, and planning recommendations."
                icon={<Target size={26} />}
                path="/strategic-planning"
              />

              <ModuleCard
                title="Forecast Governance"
                description="Maintain lifecycle stages, version control, modification history and audit trail."
                icon={<ShieldCheck size={26} />}
                path="/forecast-governance"
              />

              <ModuleCard
                title="Executive Command Center"
                description="View executive health score, alerts, strategic summaries and business performance."
                icon={<FileText size={26} />}
                path="/executive-command-center"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 text-xl font-bold">
                  Recent Notifications
                </h2>

                {data.notifications.length === 0 ? (
                  <Empty text="No notifications available." />
                ) : (
                  <div className="space-y-3">
                    {data.notifications.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <p className="font-semibold">{item.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to="/notification-center"
                  className="mt-5 inline-block rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                >
                  View All Notifications
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 text-xl font-bold">
                  Organization Overview
                </h2>

                {data.organizations.length === 0 ? (
                  <Empty text="No organizations created yet." />
                ) : (
                  <div className="space-y-3">
                    {data.organizations.slice(0, 5).map((org) => (
                      <Link
                        key={org.id}
                        to={`/organizations/${org.id}`}
                        className="block rounded-2xl bg-slate-50 p-4 hover:bg-slate-100"
                      >
                        <h3 className="font-bold">{org.name}</h3>
                        <p className="text-sm text-slate-500">
                          {org.industry || "Industry N/A"} •{" "}
                          {org.country || "Country N/A"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  to="/organizations"
                  className="mt-5 inline-block rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white"
                >
                  Manage Organizations
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function MetricCard({ title, value, icon, path }) {
  return (
    <Link
      to={path}
      className="rounded-3xl bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold">{value}</h3>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function InfoTile({ title, value, icon, path }) {
  return (
    <Link to={path} className="rounded-2xl bg-slate-50 p-5 hover:bg-slate-100">
      <div className="mb-3 text-blue-700">{icon}</div>
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </Link>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <span className="font-semibold">{label}</span>
      <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">
        {value}
      </span>
    </div>
  );
}

function ModuleCard({ title, description, icon, path }) {
  return (
    <Link
      to={path}
      className="rounded-3xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-4 inline-flex rounded-2xl bg-indigo-100 p-3 text-indigo-700">
        {icon}
      </div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
      {text}
    </div>
  );
}

export default EnterpriseDashboardPage;