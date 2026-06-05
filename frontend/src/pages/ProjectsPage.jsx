import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Plus,
  Lock,
  Globe,
  Archive,
  Users,
  Database,
  TrendingUp,
  Search,
  FolderKanban,
  BarChart3,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    is_public: false,
    color_tag: "blue",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const COLORS = [
    {
      name: "blue",
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-400",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "green",
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-400",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      name: "purple",
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-400",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      name: "red",
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-400",
      gradient: "from-red-500 to-orange-500",
    },
    {
      name: "yellow",
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-400",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get("/projects/");
      setProjects(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      const response = await API.post("/projects/", newProject);

      setProjects((prev) => [response.data, ...prev]);

      setNewProject({
        name: "",
        description: "",
        is_public: false,
        color_tag: "blue",
      });

      setShowCreateModal(false);
      setSuccess("Project created successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create project");
    }
  };

  const getColorStyle = (colorName) => {
    return COLORS.find((color) => color.name === colorName) || COLORS[0];
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !project.is_archived) ||
      (statusFilter === "archived" && project.is_archived) ||
      (statusFilter === "public" && project.is_public) ||
      (statusFilter === "private" && !project.is_public);

    return matchesSearch && matchesStatus;
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => !project.is_archived).length;
  const archivedProjects = projects.filter((project) => project.is_archived).length;
  const publicProjects = projects.filter((project) => project.is_public).length;

  const totalDatasets = projects.reduce(
    (sum, project) => sum + Number(project.total_datasets || 0),
    0
  );

  const totalForecasts = projects.reduce(
    (sum, project) => sum + Number(project.total_forecasts || 0),
    0
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                AI Demand Forecasting
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Forecast Workspaces
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Organize datasets, forecasts, scenarios, executive dashboards,
                and team collaboration inside project-based forecasting
                workspaces.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <HeroBadge text={`${totalProjects} Workspaces`} />
                <HeroBadge text={`${totalDatasets} Datasets`} />
                <HeroBadge text={`${totalForecasts} Forecasts`} />
                <HeroBadge text={`${publicProjects} Public`} />
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-blue-700 shadow hover:bg-blue-50"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </div>

        {error && (
          <AlertBox
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <AlertBox
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <div className="grid gap-5 md:grid-cols-4">
          <KpiCard
            title="Total Workspaces"
            value={totalProjects}
            icon={<FolderKanban size={24} />}
            color="from-blue-500 to-cyan-500"
          />

          <KpiCard
            title="Active Projects"
            value={activeProjects}
            icon={<TrendingUp size={24} />}
            color="from-green-500 to-emerald-500"
          />

          <KpiCard
            title="Datasets Linked"
            value={totalDatasets}
            icon={<Database size={24} />}
            color="from-purple-500 to-indigo-500"
          />

          <KpiCard
            title="Forecast Runs"
            value={totalForecasts}
            icon={<BarChart3 size={24} />}
            color="from-orange-500 to-red-500"
          />
        </div>

        <div className="grid gap-2 lg:grid-cols-[1fr_260px]">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Workspace Library
                </h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Search, filter, and open forecasting workspaces.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-72"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">Show all</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Quick Insights
            </h3>

            <div className="mt-4 space-y-3">
              <MiniInsight label="Filtered Results" value={filteredProjects.length} />
              <MiniInsight label="Archived" value={archivedProjects} />
              <MiniInsight label="Current Filter" value={statusFilter} />
            </div>
          </div>
        </div>
        <div className="mt-6">
            {loading ? (
                <LoadingState />
            ) : filteredProjects.length === 0 ? (
                <EmptyState
                title="No Forecast Workspaces Found"
                text="Create a workspace or change the search filters to view projects."
                onCreate={() => setShowCreateModal(true)}
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                {filteredProjects.map((project) => {
                    const colorStyle = getColorStyle(project.color_tag);
                    const progress = calculateProjectProgress(project);
                    const health = calculateProjectHealth(project);

                

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorStyle.gradient} text-white shadow`}
                    >
                      <FolderKanban size={24} />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusBadge
                        icon={project.is_public ? <Globe size={13} /> : <Lock size={13} />}
                        text={project.is_public ? "Public" : "Private"}
                        type={project.is_public ? "success" : "neutral"}
                      />

                      {project.is_archived && (
                        <StatusBadge
                          icon={<Archive size={13} />}
                          text="Archived"
                          type="danger"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className={`text-2xl font-extrabold ${colorStyle.text}`}>
                      {project.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {project.description || "No project description available."}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <ProjectMetric
                      label="Datasets"
                      value={project.total_datasets ?? 0}
                    />

                    <ProjectMetric
                      label="Forecasts"
                      value={project.total_forecasts ?? 0}
                    />

                    <ProjectMetric
                      label="Members"
                      value={project.members?.length ?? 0}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Project Progress</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        AI Readiness
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                        {health}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                      <Sparkles size={20} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                      Updated{" "}
                      {project.updated_at
                        ? new Date(project.updated_at).toLocaleDateString()
                        : "N/A"}
                    </span>

                    <span className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                      AI Ready
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <CreateProjectModal
            newProject={newProject}
            setNewProject={setNewProject}
            colors={COLORS}
            onClose={() => setShowCreateModal(false)}
            onCreate={createProject}
          />
        )}
        </div>
      </div>
    </PageLayout>
  );
}

function HeroBadge({ text }) {
  return (
    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
      {text}
    </span>
  );
}

function KpiCard({ title, value, icon, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniInsight({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ProjectMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ icon, text, type }) {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${styles[type]}`}
    >
      {icon}
      {text}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  );
}

function EmptyState({ title, text, onCreate }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
        <FolderKanban size={38} />
      </div>

      <h3 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
        {text}
      </p>

      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
      >
        <Plus size={18} />
        Create Project
      </button>
    </div>
  );
}

function AlertBox({ type, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span>{message}</span>

      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function CreateProjectModal({
  newProject,
  setNewProject,
  colors,
  onClose,
  onCreate,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Create Forecast Workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a workspace to organize datasets, forecasts, reports, and
              scenarios.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Project Name
            </label>

            <input
              type="text"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  name: e.target.value,
                })
              }
              placeholder="Example: Electronics Demand Forecast"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Description
            </label>

            <textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  description: e.target.value,
                })
              }
              placeholder="Describe the business goal for this forecasting workspace..."
              rows="4"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Color Tag
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() =>
                    setNewProject({
                      ...newProject,
                      color_tag: color.name,
                    })
                  }
                  className={`h-11 w-11 rounded-full border-4 ${color.bg} ${
                    newProject.color_tag === color.name
                      ? color.border
                      : "border-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <input
              type="checkbox"
              checked={newProject.is_public}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  is_public: e.target.checked,
                })
              }
            />
            Make this project public
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>

            <button
              onClick={onCreate}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProjectProgress(project) {
  let score = 20;

  if ((project.total_datasets || 0) > 0) score += 30;
  if ((project.total_forecasts || 0) > 0) score += 30;
  if ((project.members?.length || 0) > 0) score += 20;

  return Math.min(score, 100);
}

function calculateProjectHealth(project) {
  let score = 60;

  if ((project.total_datasets || 0) > 0) score += 15;
  if ((project.total_forecasts || 0) > 0) score += 15;
  if (project.is_public) score += 5;
  if (!project.is_archived) score += 5;

  return Math.min(score, 100);
}

export default ProjectsPage;