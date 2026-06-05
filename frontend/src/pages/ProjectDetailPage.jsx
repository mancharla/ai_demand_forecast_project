import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Users,
  Database,
  TrendingUp,
  Settings,
  MessageCircle,
  Zap,
  Pencil,
  Trash2,
  UploadCloud,
    Brain,
} from "lucide-react";
import { FileText } from "lucide-react";
import { Activity } from "lucide-react";
import { GitBranch } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Calendar } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Share2 } from "lucide-react";
import { HeartPulse } from "lucide-react";


function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [datasets, setDatasets] = useState([]);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const [editProjectData, setEditProjectData] = useState({
    name: "",
    description: "",
    is_public: false,
  });

  const [newMember, setNewMember] = useState({
    user_id: "",
    role: "viewer",
    can_edit: false,
    can_delete: false,
    can_share: false,
    can_export: false,
  });

  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    scenario_type: "custom",
  });

  const [memberError, setMemberError] = useState("");
  const [scenarioError, setScenarioError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "members", label: "Team", icon: Users },
    { id: "datasets", label: "Datasets", icon: Database },
    { id: "scenarios", label: "Scenarios", icon: Zap },
    { id: "activity", label: "Activity", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "members") fetchMembers();
    if (activeTab === "activity") fetchActivity();
    if (activeTab === "scenarios") fetchScenarios();
    if (activeTab === "datasets") fetchDatasets();
  }, [activeTab]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/projects/${projectId}`);
      setProject(response.data);
      setEditProjectData({
        name: response.data.name || "",
        description: response.data.description || "",
        is_public: response.data.is_public || false,
      });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/members`);
      setMembers(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/activity`);
      setActivity(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScenarios = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/scenarios`);
      setScenarios(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/datasets`);
      setDatasets(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProjectSetting = async (field, value) => {
    try {
      await API.put(`/projects/${projectId}`, { [field]: value });
      await fetchProjectDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update project settings.");
    }
  };

  const handleQuickForecast = () => {
    navigate(`/forecast?project_id=${projectId}`);
  };

  const handleOpenAddMember = () => {
    setNewMember({
      user_id: "",
      role: "viewer",
      can_edit: false,
      can_delete: false,
      can_share: false,
      can_export: false,
    });
    setMemberError("");
    setShowAddMemberModal(true);
  };

  const handleAddMember = async () => {
    if (!newMember.user_id) {
      setMemberError("Please enter a user ID.");
      return;
    }

    try {
      await API.post(`/projects/${projectId}/members`, {
        user_id: Number(newMember.user_id),
        role: newMember.role,
        can_edit: newMember.can_edit,
        can_delete: newMember.can_delete,
        can_share: newMember.can_share,
        can_export: newMember.can_export,
      });

      setShowAddMemberModal(false);
      await fetchMembers();
      await fetchProjectDetails();
    } catch (err) {
      console.error(err);
      setMemberError(err.response?.data?.detail || "Failed to add team member.");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this team member?")) return;

    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      await fetchMembers();
      await fetchProjectDetails();
    } catch (err) {
      console.error(err);
      setMemberError(err.response?.data?.detail || "Failed to remove team member.");
    }
  };

  const handleOpenScenarioModal = () => {
    setNewScenario({
      name: "",
      description: "",
      scenario_type: "custom",
    });
    setScenarioError("");
    setShowScenarioModal(true);
  };

  const handleCreateScenario = async () => {
    if (!newScenario.name.trim()) {
      setScenarioError("Please enter a scenario name.");
      return;
    }

    try {
      await API.post(`/projects/${projectId}/scenarios`, newScenario);
      setShowScenarioModal(false);
      await fetchScenarios();
    } catch (err) {
      console.error(err);
      setScenarioError(err.response?.data?.detail || "Failed to create scenario.");
    }
  };

  const handleUploadFileChange = (e) => {
    setUploadError("");
    setUploadMessage("");
    setUploadFile(e.target.files[0] || null);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please choose a CSV or Excel file to upload.");
      return;
    }

    const extension = uploadFile.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx"].includes(extension)) {
      setUploadError("Only CSV and Excel files are allowed.");
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError("");
      setUploadMessage("");

      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await API.post(
        `/datasets/upload?project_id=${projectId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadMessage(response.data.message || "Dataset uploaded successfully.");
      setUploadFile(null);
      await fetchProjectDetails();
      await fetchDatasets();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to upload dataset.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemoveDataset = async (datasetId) => {
    if (!window.confirm("Remove this dataset from the project?")) return;

    try {
      await API.delete(`/projects/${projectId}/datasets/${datasetId}`);
      await fetchProjectDetails();
      await fetchDatasets();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to remove dataset.");
    }
  };

  const handleUpdateProject = async () => {
    try {
      await API.put(`/projects/${projectId}`, editProjectData);
      setShowEditModal(false);
      await fetchProjectDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update project.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;

    try {
      await API.delete(`/projects/${projectId}`);
      navigate("/projects");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete project.");
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout>
        <div className="rounded-3xl bg-red-50 p-8 text-center text-red-700">
          <h2 className="text-2xl font-bold">Project not found</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div className="mb-6 flex items-center justify-between">
        <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow hover:bg-slate-50"
        >
            <ArrowLeft size={18} />
            Back to Workspaces
        </button>

        <div className="text-sm text-slate-500">
            Workspaces / {project?.name}
        </div>
        </div>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Forecast Workspace
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">{project.name}</h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                {project.description ||
                  "Manage datasets, forecasts, scenarios, team collaboration, and executive analytics from one workspace."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Badge text={`${project.total_datasets ?? 0} Datasets`} />
                <Badge text={`${project.total_forecasts ?? 0} Forecasts`} />
                <Badge text={`${project.members?.length || 0} Members`} />
                <Badge text={project.is_public ? "Public" : "Private"} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                onClick={handleDeleteProject}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <StatCard
                    title="Total Datasets"
                    value={project.total_datasets ?? 0}
                    icon={<Database size={24} />}
                    color="from-blue-500 to-cyan-500"
                  />

                  <StatCard
                    title="Total Forecasts"
                    value={project.total_forecasts ?? 0}
                    icon={<TrendingUp size={24} />}
                    color="from-green-500 to-emerald-500"
                  />

                  <StatCard
                    title="Team Members"
                    value={project.members?.length || 0}
                    icon={<Users size={24} />}
                    color="from-purple-500 to-indigo-500"
                  />
                </div>

                <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white">
                  <h3 className="text-2xl font-extrabold">Quick Actions</h3>
                  <p className="mt-2 text-blue-100">
                    Start forecasting, upload datasets, create scenarios, or open executive analytics.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <ActionButton
                      icon={<UploadCloud size={18} />}
                      text="Upload Dataset"
                      onClick={() => setActiveTab("datasets")}
                    />

                    <ActionButton
                      icon={<TrendingUp size={18} />}
                      text="New Forecast"
                      onClick={handleQuickForecast}
                    />

                    <ActionButton
                      icon={<Zap size={18} />}
                      text="Create Scenario"
                      onClick={handleOpenScenarioModal}
                    />

                    <ActionButton
                      icon={<Users size={18} />}
                      text="Executive Dashboard"
                      onClick={() =>
                        navigate(`/executive-dashboard?project_id=${projectId}`)
                      }
                    />
                    <ActionButton
                        icon={<Brain size={18} />}
                        text="AI Insights"
                        onClick={() =>
                        navigate(`/ai-insights/${projectId}`)
                        }
                    />
                    <ActionButton
                    icon={<FileText size={18} />}
                    text="Executive Reports"
                    onClick={() =>
                        navigate(`/executive-reports/${projectId}`)
                    }
                    />
                    <ActionButton
                    icon={<Activity size={18} />}
                    text="Model Performance"
                    onClick={() => navigate(`/model-performance/${projectId}`)}
                    />
                    <ActionButton
                    icon={<GitBranch size={18} />}
                    text="Dataset Versions"
                    onClick={() =>
                        navigate(`/dataset-versions/${projectId}`)
                    }
                    />
                    <ActionButton
                    icon={<MessageSquare size={18} />}
                    text="Collaboration"
                    onClick={() =>
                        navigate(`/forecast-collaboration/${projectId}`)
                    }
                    />
                    <ActionButton
                    icon={<LayoutDashboard size={18} />}
                    text="Dashboard Builder"
                    onClick={() =>
                        navigate(`/dashboard-customization/${projectId}`)
                    }
                    />
                    <ActionButton
                    icon={<Calendar size={18} />}
                    text="Forecast Schedules"
                    onClick={() => navigate(`/forecast-schedules/${projectId}`)}
                  />
                  <ActionButton
                    icon={<Activity size={18} />}
                    text="Activity Timeline"
                    onClick={() => navigate(`/activity-timeline/${projectId}`)}
                  />
                  <ActionButton
                    icon={<BarChart3 size={18} />}
                    text="Interactive Analytics"
                    onClick={() => navigate(`/interactive-dashboard/${projectId}`)}
                  />
                  <ActionButton
                    icon={<Share2 size={18} />}
                    text="Share Reports"
                    onClick={() => navigate("/report-sharing")}
                  />
                  <ActionButton
                    icon={<HeartPulse size={18} />}
                    text="Business Health"
                    onClick={() =>
                      navigate(`/business-health/${projectId}`)
                    }
                  />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <InfoCard
                    title="Workspace Status"
                    value={project.is_archived ? "Archived" : "Active"}
                    note="Project operational status"
                  />

                  <InfoCard
                    title="Visibility"
                    value={project.is_public ? "Public" : "Private"}
                    note="Project access level"
                  />

                  <InfoCard
                    title="Project ID"
                    value={`#${project.id}`}
                    note="Internal workspace reference"
                  />
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Team Members
                    </h2>
                    <p className="text-sm text-slate-500">
                      Manage project collaborators and permissions.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddMember}
                    className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>

                {members.length === 0 ? (
                  <EmptyState text="No team members yet." />
                ) : (
                  <div className="grid gap-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              User ID: {member.user_id}
                            </p>
                            <p className="text-sm text-slate-500">
                              Role: {member.role}
                            </p>
                          </div>

                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "datasets" && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Upload Dataset
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Upload CSV or Excel file and attach it to this project.
                  </p>

                  <div className="mt-6 space-y-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleUploadFileChange}
                      className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />

                    {uploadError && (
                      <p className="text-sm font-semibold text-red-600">
                        {uploadError}
                      </p>
                    )}

                    {uploadMessage && (
                      <p className="text-sm font-semibold text-green-600">
                        {uploadMessage}
                      </p>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={uploadLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      <UploadCloud size={18} />
                      {uploadLoading ? "Uploading..." : "Upload & Attach"}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Connected Datasets
                  </h3>

                  {datasets.length === 0 ? (
                    <EmptyState text="No datasets attached yet." />
                  ) : (
                    <div className="mt-5 space-y-4">
                      {datasets.map((dataset) => (
                        <div
                          key={dataset.dataset_id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">
                            {dataset.file_name}
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            Rows: {dataset.rows_count || 0} · Columns:{" "}
                            {dataset.columns_count || 0}
                          </p>

                          <button
                            onClick={() => handleRemoveDataset(dataset.dataset_id)}
                            className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "scenarios" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Scenarios
                    </h2>
                    <p className="text-sm text-slate-500">
                      Create and compare what-if forecasting scenarios.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenScenarioModal}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    <Zap size={18} />
                    Create Scenario
                  </button>
                </div>

                {scenarios.length === 0 ? (
                  <EmptyState text="No scenarios created yet." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {scenario.name}
                            </h4>
                            <p className="mt-1 text-sm text-slate-500">
                              {scenario.description || "No description"}
                            </p>
                          </div>

                          <span
                            className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${
                              scenario.is_published
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {scenario.is_published ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Type: {scenario.scenario_type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Activity Timeline
                </h2>

                {activity.length === 0 ? (
                  <EmptyState text="No activity yet." />
                ) : (
                  activity.map((act) => (
                    <div
                      key={act.id}
                      className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div className="mt-2 h-3 w-3 rounded-full bg-blue-600"></div>
                      <div>
                        <p className="font-bold capitalize text-slate-900 dark:text-white">
                          {act.action}
                        </p>
                        <p className="text-sm text-slate-500">
                          {act.description}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(act.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Project Settings
                </h2>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={project.is_public}
                      onChange={(e) =>
                        handleToggleProjectSetting("is_public", e.target.checked)
                      }
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Make this project public
                    </span>
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={project.is_archived}
                      onChange={(e) =>
                        handleToggleProjectSetting("is_archived", e.target.checked)
                      }
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Archive this project
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleDeleteProject}
                  className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal
          editProjectData={editProjectData}
          setEditProjectData={setEditProjectData}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateProject}
          error={error}
        />
      )}

      {showAddMemberModal && (
        <AddMemberModal
          newMember={newMember}
          setNewMember={setNewMember}
          onClose={() => setShowAddMemberModal(false)}
          onSave={handleAddMember}
          error={memberError}
        />
      )}

      {showScenarioModal && (
        <ScenarioModal
          newScenario={newScenario}
          setNewScenario={setNewScenario}
          onClose={() => setShowScenarioModal(false)}
          onSave={handleCreateScenario}
          error={scenarioError}
        />
      )}
    </PageLayout>
  );
}

function Badge({ text }) {
  return (
    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
      {text}
    </span>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
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

function ActionButton({ icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-4 font-bold text-white transition hover:bg-white/25"
    >
      {icon}
      {text}
    </button>
  );
}

function InfoCard({ title, value, note }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </h3>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950">
      {text}
    </div>
  );
}

function ModalWrapper({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}

function EditProjectModal({
  editProjectData,
  setEditProjectData,
  onClose,
  onSave,
  error,
}) {
  return (
    <ModalWrapper>
      <ModalHeader title="Edit Project" subtitle="Update project details." onClose={onClose} />

      <div className="mt-6 space-y-5">
        <InputBlock
          label="Project Name"
          value={editProjectData.name}
          onChange={(value) =>
            setEditProjectData({ ...editProjectData, name: value })
          }
        />

        <TextareaBlock
          label="Description"
          value={editProjectData.description}
          onChange={(value) =>
            setEditProjectData({ ...editProjectData, description: value })
          }
        />

        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={editProjectData.is_public}
            onChange={(e) =>
              setEditProjectData({
                ...editProjectData,
                is_public: e.target.checked,
              })
            }
          />
          Public project
        </label>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <ModalActions onSave={onSave} onClose={onClose} saveText="Save Changes" />
      </div>
    </ModalWrapper>
  );
}

function AddMemberModal({ newMember, setNewMember, onClose, onSave, error }) {
  return (
    <ModalWrapper>
      <ModalHeader title="Add Team Member" subtitle="Add existing user by ID." onClose={onClose} />

      <div className="mt-6 space-y-5">
        <InputBlock
          label="User ID"
          value={newMember.user_id}
          onChange={(value) => setNewMember({ ...newMember, user_id: value })}
        />

        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Role
          </label>

          <select
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="viewer">Viewer</option>
            <option value="analyst">Analyst</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <ModalActions onSave={onSave} onClose={onClose} saveText="Save Member" />
      </div>
    </ModalWrapper>
  );
}

function ScenarioModal({ newScenario, setNewScenario, onClose, onSave, error }) {
  return (
    <ModalWrapper>
      <ModalHeader title="Create Scenario" subtitle="Create a what-if scenario." onClose={onClose} />

      <div className="mt-6 space-y-5">
        <InputBlock
          label="Scenario Name"
          value={newScenario.name}
          onChange={(value) => setNewScenario({ ...newScenario, name: value })}
        />

        <TextareaBlock
          label="Description"
          value={newScenario.description}
          onChange={(value) =>
            setNewScenario({ ...newScenario, description: value })
          }
        />

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <ModalActions onSave={onSave} onClose={onClose} saveText="Save Scenario" />
      </div>
    </ModalWrapper>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <button
        onClick={onClose}
        className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      >
        ✕
      </button>
    </div>
  );
}

function InputBlock({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </div>
  );
}

function TextareaBlock({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <textarea
        rows="4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </div>
  );
}

function ModalActions({ onSave, onClose, saveText }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onSave}
        className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
      >
        {saveText}
      </button>

      <button
        onClick={onClose}
        className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        Cancel
      </button>
    </div>
  );
}

export default ProjectDetailPage;