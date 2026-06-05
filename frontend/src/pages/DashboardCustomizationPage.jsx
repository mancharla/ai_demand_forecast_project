import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Settings,
  BarChart3,
  LineChart,
  PieChart,
  Brain,
  Activity,
} from "lucide-react";

function DashboardCustomizationPage() {
  const { projectId } = useParams();

  const [layouts, setLayouts] = useState([]);
  const [widgets, setWidgets] = useState([]);

  const [selectedLayout, setSelectedLayout] = useState(null);
  const [layoutName, setLayoutName] = useState("");

  const [widgetName, setWidgetName] = useState("");
  const [widgetType, setWidgetType] = useState("revenue_kpi");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const widgetTypes = [
    {
      value: "revenue_kpi",
      label: "Revenue KPI",
      icon: BarChart3,
    },
    {
      value: "profit_kpi",
      label: "Profit KPI",
      icon: LineChart,
    },
    {
      value: "forecast_accuracy",
      label: "Forecast Accuracy",
      icon: Activity,
    },
    {
      value: "top_products",
      label: "Top Products",
      icon: PieChart,
    },
    {
      value: "ai_insights",
      label: "AI Insights",
      icon: Brain,
    },
    {
      value: "model_performance",
      label: "Model Performance",
      icon: Settings,
    },
  ];

  useEffect(() => {
    fetchLayouts();
    fetchWidgets();
  }, [projectId]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchLayouts = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/dashboard-customization/layouts/project/${projectId}`
      );

      setLayouts(response.data || []);

      if (response.data?.length > 0 && !selectedLayout) {
        setSelectedLayout(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard layouts");
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgets = async () => {
    try {
      const response = await API.get("/dashboard-customization/widgets");
      setWidgets(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load widgets");
    }
  };

  const createLayout = async () => {
    if (!layoutName.trim()) {
      setError("Please enter layout name");
      return;
    }

    try {
      const response = await API.post("/dashboard-customization/layouts", {
        project_id: Number(projectId),
        layout_name: layoutName,
      });

      setLayoutName("");
      setSelectedLayout(response.data.layout);
      await fetchLayouts();

      showMessage("Layout created successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create layout");
    }
  };

  const deleteLayout = async (layoutId) => {
    if (!window.confirm("Delete this dashboard layout?")) return;

    try {
      await API.delete(`/dashboard-customization/layouts/${layoutId}`);

      if (selectedLayout?.id === layoutId) {
        setSelectedLayout(null);
      }

      await fetchLayouts();

      showMessage("Layout deleted successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to delete layout");
    }
  };

  const setDefaultLayout = async (layout) => {
    try {
      await API.put(`/dashboard-customization/layouts/${layout.id}`, {
        is_default: 1,
      });

      await fetchLayouts();

      showMessage("Layout set as default");
    } catch (err) {
      console.error(err);
      setError("Failed to update layout");
    }
  };

  const createWidget = async () => {
    if (!widgetName.trim()) {
      setError("Please enter widget name");
      return;
    }

    try {
      await API.post("/dashboard-customization/widgets", {
        widget_name: widgetName,
        widget_type: widgetType,
        position: widgets.length + 1,
      });

      setWidgetName("");
      setWidgetType("revenue_kpi");

      await fetchWidgets();

      showMessage("Widget added successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to add widget");
    }
  };

  const toggleWidgetVisibility = async (widget) => {
    try {
      await API.put(`/dashboard-customization/widgets/${widget.id}`, {
        is_visible: widget.is_visible ? 0 : 1,
      });

      await fetchWidgets();
    } catch (err) {
      console.error(err);
      setError("Failed to update widget");
    }
  };

  const deleteWidget = async (widgetId) => {
    if (!window.confirm("Delete this widget?")) return;

    try {
      await API.delete(`/dashboard-customization/widgets/${widgetId}`);
      await fetchWidgets();

      showMessage("Widget deleted successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to delete widget");
    }
  };

  const visibleWidgets = widgets.filter((widget) => widget.is_visible);

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Dashboard Builder
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Dashboard Customization Center
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Create dashboard layouts, add widgets, save custom views, and
                personalize analytics for each forecasting workspace.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <HeroBadge text={`${layouts.length} Layouts`} />
                <HeroBadge text={`${widgets.length} Widgets`} />
                <HeroBadge text={`${visibleWidgets.length} Visible`} />
                <HeroBadge text={`Project #${projectId}`} />
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <LayoutDashboard size={44} />
            </div>
          </div>
        </div>

        {message && (
          <AlertBox type="success" message={message} onClose={() => setMessage("")} />
        )}

        {error && (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        )}

        <div className="grid gap-5 md:grid-cols-4">
          <KpiCard
            title="Layouts"
            value={layouts.length}
            icon={<LayoutDashboard size={24} />}
            color="from-blue-500 to-cyan-500"
          />

          <KpiCard
            title="Widgets"
            value={widgets.length}
            icon={<BarChart3 size={24} />}
            color="from-green-500 to-emerald-500"
          />

          <KpiCard
            title="Visible Widgets"
            value={visibleWidgets.length}
            icon={<Eye size={24} />}
            color="from-purple-500 to-indigo-500"
          />

          <KpiCard
            title="Hidden Widgets"
            value={widgets.length - visibleWidgets.length}
            icon={<EyeOff size={24} />}
            color="from-orange-500 to-red-500"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create Layout
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Save a custom dashboard layout for this project.
              </p>

              <div className="mt-5 space-y-4">
                <input
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Example: Executive Dashboard Layout"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <button
                  onClick={createLayout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  <Save size={18} />
                  Save Layout
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Saved Layouts
              </h2>

              {loading ? (
                <EmptyState text="Loading layouts..." />
              ) : layouts.length === 0 ? (
                <EmptyState text="No layouts saved yet." />
              ) : (
                <div className="mt-5 space-y-3">
                  {layouts.map((layout) => (
                    <div
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        selectedLayout?.id === layout.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {layout.layout_name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Created:{" "}
                            {layout.created_at
                              ? new Date(layout.created_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {layout.is_default ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefaultLayout(layout);
                              }}
                              className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"
                            >
                              Set Default
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayout(layout.id);
                            }}
                            className="rounded-xl bg-red-100 p-2 text-red-700 hover:bg-red-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Add Widget
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Choose analytics widgets to display in your custom dashboard.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="Widget name"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <select
                  value={widgetType}
                  onChange={(e) => setWidgetType(e.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {widgetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={createWidget}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Dashboard Preview
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Preview visible widgets in the selected layout.
                  </p>
                </div>
              </div>

              {visibleWidgets.length === 0 ? (
                <EmptyState text="No visible widgets. Add a widget to preview dashboard." />
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {visibleWidgets.map((widget) => (
                    <WidgetPreview
                      key={widget.id}
                      widget={widget}
                      widgetTypes={widgetTypes}
                      onToggle={() => toggleWidgetVisibility(widget)}
                      onDelete={() => deleteWidget(widget.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                All Widgets
              </h2>

              {widgets.length === 0 ? (
                <EmptyState text="No widgets created yet." />
              ) : (
                <div className="mt-5 space-y-3">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {widget.widget_name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {widget.widget_type} · Position {widget.position}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWidgetVisibility(widget)}
                          className="rounded-xl bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                        >
                          {widget.is_visible ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => deleteWidget(widget.id)}
                          className="rounded-xl bg-red-100 p-2 text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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

function WidgetPreview({ widget, widgetTypes, onToggle, onDelete }) {
  const type = widgetTypes.find((item) => item.value === widget.widget_type);
  const Icon = type?.icon || BarChart3;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
            <Icon size={22} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {widget.widget_name}
            </h3>

            <p className="text-sm text-slate-500">
              {type?.label || widget.widget_type}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="rounded-xl bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
          >
            <EyeOff size={15} />
          </button>

          <button
            onClick={onDelete}
            className="rounded-xl bg-red-100 p-2 text-red-700 hover:bg-red-200"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Preview</p>
        <h4 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          {getDemoValue(widget.widget_type)}
        </h4>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
      {text}
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
      <button onClick={onClose}>✕</button>
    </div>
  );
}

function getDemoValue(type) {
  switch (type) {
    case "revenue_kpi":
      return "₹ 24.5L";
    case "profit_kpi":
      return "₹ 7.2L";
    case "forecast_accuracy":
      return "92.4%";
    case "top_products":
      return "Mobile";
    case "ai_insights":
      return "4 Insights";
    case "model_performance":
      return "XGBoost";
    default:
      return "Active";
  }
}

export default DashboardCustomizationPage;