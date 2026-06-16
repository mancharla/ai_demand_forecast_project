import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function ProjectOverviewPage() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        organizations,
        workflows,
        executive,
        quality,
        kpi,
        audit,
      ] = await Promise.all([
        API.get("/organizations/my-organizations"),
        API.get("/workflows/my-workflows"),
        API.get("/executive-command-center/summary"),
        API.get("/data-quality/report-summary"),
        API.get("/kpi-management/dashboard"),
        API.get("/audit-logs/summary"),
      ]);

      setStats({
        organizations: organizations.data?.length || 0,
        workflows: workflows.data?.length || 0,
        executive:
          executive.data?.executive_health_score || 0,
        quality:
          quality.data?.average_score || 0,
        kpis:
          kpi.data?.total_kpis || 0,
        audits:
          audit.data?.total_logs || 0,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-800 to-cyan-700 p-8 text-white">
          <h1 className="text-5xl font-extrabold">
            Advanced AI Demand Forecasting
          </h1>

          <p className="mt-4 text-xl text-blue-100">
            Enterprise Forecasting Ecosystem
          </p>

          <p className="mt-3 max-w-4xl text-blue-100">
            Complete business intelligence platform with
            forecasting, governance, approvals, KPI tracking,
            workflow automation, data quality monitoring,
            executive reporting, and organization management.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">

          <StatCard
            title="Organizations"
            value={stats.organizations}
          />

          <StatCard
            title="Workflows"
            value={stats.workflows}
          />

          <StatCard
            title="Executive Health"
            value={`${stats.executive}%`}
          />

          <StatCard
            title="Quality Score"
            value={`${stats.quality}%`}
          />

          <StatCard
            title="KPIs"
            value={stats.kpis}
          />

          <StatCard
            title="Audit Logs"
            value={stats.audits}
          />

        </div>

        <div className="rounded-3xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold">
            Project Modules
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            <Module title="Forecast Workspace Management" />
            <Module title="Scenario Planning" />
            <Module title="Executive Dashboard" />
            <Module title="AI Insights Engine" />
            <Module title="Forecast Collaboration" />
            <Module title="Dataset Versioning" />
            <Module title="Forecast Accuracy Center" />
            <Module title="Organization Management" />
            <Module title="Approval Workflow" />
            <Module title="Workflow Automation" />
            <Module title="Governance Center" />
            <Module title="Executive Command Center" />

          </div>

        </div>

      </div>
    </PageLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">
        {value}
      </h3>
    </div>
  );
}

function Module({ title }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 font-semibold">
      ✅ {title}
    </div>
  );
}

export default ProjectOverviewPage;