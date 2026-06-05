import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Activity,
  Database,
  FileText,
  Brain,
  GitBranch,
  BarChart3,
  RefreshCw,
} from "lucide-react";

function ActivityTimelinePage() {
  const { projectId } = useParams();

  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeline();
    fetchSummary();
  }, [projectId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/activity-timeline/project/${projectId}`);
      setTimeline(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await API.get(
        `/activity-timeline/project-summary/${projectId}`
      );
      setSummary(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredTimeline =
    filter === "all"
      ? timeline
      : timeline.filter((item) => item.type === filter);

  const getIcon = (type) => {
    if (type === "ai_insight") return <Brain size={18} />;
    if (type === "report") return <FileText size={18} />;
    if (type === "scenario") return <GitBranch size={18} />;
    if (type === "activity") return <Activity size={18} />;
    return <BarChart3 size={18} />;
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Activity Timeline
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Project Activity Center
              </h1>

              <p className="mt-3 text-blue-100">
                Track forecasting actions, reports, scenarios, AI insights, and
                workspace activity.
              </p>
            </div>

            <button
              onClick={() => {
                fetchTimeline();
                fetchSummary();
              }}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-5">
          <SummaryCard
            title="Datasets"
            value={summary?.datasets_uploaded || 0}
            icon={<Database size={22} />}
          />
          <SummaryCard
            title="Forecasts"
            value={summary?.forecasts_generated || 0}
            icon={<BarChart3 size={22} />}
          />
          <SummaryCard
            title="Scenarios"
            value={summary?.scenarios_created || 0}
            icon={<GitBranch size={22} />}
          />
          <SummaryCard
            title="AI Insights"
            value={summary?.ai_insights_generated || 0}
            icon={<Brain size={22} />}
          />
          <SummaryCard
            title="Reports"
            value={summary?.reports_generated || 0}
            icon={<FileText size={22} />}
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Timeline Events</h2>
              <p className="text-sm text-slate-500">
                Latest project actions and business intelligence events.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">All Events</option>
              <option value="activity">Activities</option>
              <option value="ai_insight">AI Insights</option>
              <option value="report">Reports</option>
              <option value="scenario">Scenarios</option>
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading timeline...
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No activity found.
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {filteredTimeline.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      {getIcon(item.type)}
                    </div>
                    <div className="mt-2 h-full w-0.5 bg-slate-200" />
                  </div>

                  <div className="flex-1 rounded-2xl border bg-slate-50 p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <h3 className="font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {item.description || "No description"}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold">{value}</h3>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default ActivityTimelinePage;