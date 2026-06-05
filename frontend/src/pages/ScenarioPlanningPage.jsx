import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Plus,
  Copy,
  Trash2,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Brain,
  BarChart3,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ScenarioPlanningPage() {
  const { projectId } = useParams();

  const [scenarios, setScenarios] = useState([]);
  const [predefinedScenarios, setPredefinedScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [forecasts, setForecasts] = useState([]);
  const [selectedForecast, setSelectedForecast] = useState("");

  const [loading, setLoading] = useState(true);
  const [generatingForecast, setGeneratingForecast] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    scenario_type: "custom",
    variables: {
      sales_growth: 0,
      seasonality: 1.0,
      market_share: 0,
    },
  });

  const [forecastResult, setForecastResult] = useState(null);

  useEffect(() => {
    fetchScenarios();
    fetchPredefinedScenarios();
    fetchForecasts();
  }, [projectId]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchScenarios = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/projects/${projectId}/scenarios`);

      setScenarios(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchPredefinedScenarios = async () => {
    try {
      const response = await API.get("/projects/templates/predefined-scenarios");

      const templateList = Object.entries(response.data || {}).map(
        ([key, value]) => ({
          id: key,
          ...value,
        })
      );

      setPredefinedScenarios(templateList);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForecasts = async () => {
    try {
      const response = await API.get("/forecast/history/my-history?limit=50");
      setForecasts(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createScenario = async () => {
    clearMessages();

    if (!newScenario.name.trim()) {
      setError("Scenario name is required");
      return;
    }

    try {
      const response = await API.post(
        `/projects/${projectId}/scenarios`,
        newScenario
      );

      setScenarios((prev) => [response.data, ...prev]);
      setSelectedScenario(response.data);

      setNewScenario({
        name: "",
        description: "",
        scenario_type: "custom",
        variables: {
          sales_growth: 0,
          seasonality: 1.0,
          market_share: 0,
        },
      });

      setShowCreateModal(false);
      showSuccess("Scenario created successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create scenario");
    }
  };

  const createFromTemplate = async (templateId, templateName) => {
    clearMessages();

    const name = prompt(`Enter scenario name for ${templateName}:`);

    if (!name) return;

    try {
      const response = await API.post(
        `/projects/${projectId}/scenarios/create-from-template`,
        null,
        {
          params: {
            template_name: templateId,
            scenario_name: name,
          },
        }
      );

      setScenarios((prev) => [response.data, ...prev]);
      setSelectedScenario(response.data);
      setShowTemplateModal(false);
      showSuccess("Scenario created from template");
    } catch (err) {
      console.error(err);
      setError("Failed to create scenario from template");
    }
  };

  const generateForecast = async (scenarioId) => {
    clearMessages();

    if (!selectedForecast) {
      setError("Please select a base forecast");
      return;
    }

    try {
      setGeneratingForecast(true);

      const response = await API.post(
        `/projects/${projectId}/scenarios/${scenarioId}/generate-forecast`,
        null,
        {
          params: {
            base_forecast_id: selectedForecast,
          },
        }
      );

      setForecastResult(response.data);
      showSuccess("Scenario forecast generated successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to generate forecast");
    } finally {
      setGeneratingForecast(false);
    }
  };

  const deleteScenario = async (scenarioId) => {
    clearMessages();

    if (!window.confirm("Delete this scenario?")) return;

    try {
      await API.delete(`/projects/${projectId}/scenarios/${scenarioId}`);

      setScenarios((prev) =>
        prev.filter((scenario) => scenario.id !== scenarioId)
      );

      if (selectedScenario?.id === scenarioId) {
        setSelectedScenario(null);
        setForecastResult(null);
      }

      showSuccess("Scenario deleted successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to delete scenario");
    }
  };

  const cloneScenario = async (scenarioId) => {
    clearMessages();

    const newName = prompt("Enter name for cloned scenario:");

    if (!newName) return;

    try {
      const response = await API.post(
        `/projects/${projectId}/scenarios/${scenarioId}/clone`,
        null,
        {
          params: {
            new_name: newName,
          },
        }
      );

      setScenarios((prev) => [response.data, ...prev]);
      showSuccess("Scenario cloned successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to clone scenario");
    }
  };

  const totalChangePercentage =
    forecastResult?.summary?.total_change_percentage || 0;

  const originalSales = forecastResult?.summary?.total_original_sales || 0;
  const modifiedSales = forecastResult?.summary?.total_modified_sales || 0;

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Forecast Workspace
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                What-If Scenario Planning
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Simulate sales growth, seasonality, market share, and demand
                changes before making inventory and business decisions.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <HeroBadge text={`${scenarios.length} Scenarios`} />
                <HeroBadge text={`${forecasts.length} Base Forecasts`} />
                <HeroBadge text={`${predefinedScenarios.length} Templates`} />
                <HeroBadge text={`Project #${projectId}`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="rounded-2xl bg-white/15 px-5 py-3 font-bold text-white backdrop-blur hover:bg-white/25"
              >
                Use Template
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
              >
                <Plus size={18} />
                New Scenario
              </button>
            </div>
          </div>
        </div>

        {error && (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
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
            title="Total Scenarios"
            value={scenarios.length}
            icon={<Layers size={24} />}
            color="from-blue-500 to-cyan-500"
          />

          <KpiCard
            title="Base Forecasts"
            value={forecasts.length}
            icon={<BarChart3 size={24} />}
            color="from-green-500 to-emerald-500"
          />

          <KpiCard
            title="Templates"
            value={predefinedScenarios.length}
            icon={<Zap size={24} />}
            color="from-purple-500 to-indigo-500"
          />

          <KpiCard
            title="Active Scenario"
            value={selectedScenario?.name || "None"}
            icon={<Brain size={24} />}
            color="from-orange-500 to-red-500"
            small
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Base Forecast Selection
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose an existing forecast to apply scenario variables.
              </p>
            </div>

            <select
              value={selectedForecast || ""}
              onChange={(e) => setSelectedForecast(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:max-w-md"
            >
              <option value="">Choose a forecast to base scenarios on...</option>

              {forecasts.map((forecast) => (
                <option key={forecast.id} value={forecast.id}>
                  #{forecast.id} - {forecast.model_name} -{" "}
                  {forecast.forecast_days} days
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Scenarios
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select a scenario to simulate outcomes.
                </p>
              </div>
            </div>

            {loading ? (
              <EmptyState text="Loading scenarios..." />
            ) : scenarios.length === 0 ? (
              <EmptyState text="No scenarios yet. Create one to begin." />
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    selected={selectedScenario?.id === scenario.id}
                    onSelect={() => {
                      setSelectedScenario(scenario);
                      setForecastResult(null);
                    }}
                    onClone={() => cloneScenario(scenario.id)}
                    onDelete={() => deleteScenario(scenario.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            {selectedScenario ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                        Selected Scenario
                      </p>

                      <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                        {selectedScenario.name}
                      </h2>

                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {selectedScenario.description ||
                          "No description provided for this scenario."}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {selectedScenario.scenario_type}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {Object.entries(selectedScenario.variables || {}).map(
                      ([key, value]) => (
                        <VariableCard
                          key={key}
                          label={key}
                          value={value}
                        />
                      )
                    )}
                  </div>

                  <button
                    onClick={() => generateForecast(selectedScenario.id)}
                    disabled={!selectedForecast || generatingForecast}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 font-bold text-white shadow hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingForecast
                      ? "Generating Scenario Forecast..."
                      : "Generate Scenario Forecast"}
                  </button>
                </div>

                {forecastResult && (
                  <div className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-3">
                      <ImpactCard
                        title="Sales Impact"
                        value={`${totalChangePercentage > 0 ? "+" : ""}${Number(
                          totalChangePercentage
                        ).toFixed(1)}%`}
                        positive={totalChangePercentage >= 0}
                      />

                      <ImpactCard
                        title="Original Sales"
                        value={formatCurrency(originalSales)}
                        neutral
                      />

                      <ImpactCard
                        title="Modified Sales"
                        value={formatCurrency(modifiedSales)}
                        positive={modifiedSales >= originalSales}
                      />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Forecast Outcome Comparison
                      </h3>

                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Original forecast values compared with scenario-adjusted
                        sales.
                      </p>

                      {forecastResult.forecast?.length > 0 ? (
                        <div className="mt-6">
                          <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={forecastResult.forecast}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="product" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) => formatCurrency(value)}
                              />
                              <Legend />
                              <Bar
                                dataKey="sales"
                                fill="#2563eb"
                                name="Original Sales"
                                radius={[10, 10, 0, 0]}
                              />
                              <Bar
                                dataKey="modified_sales"
                                fill="#f97316"
                                name="Modified Sales"
                                radius={[10, 10, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <EmptyState text="No forecast output available." />
                      )}
                    </div>

                    <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-xl">
                      <div className="flex items-center gap-3">
                        <Brain size={24} />
                        <h3 className="text-xl font-extrabold">
                          AI Scenario Insights
                        </h3>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <InsightCard
                          title="Demand Direction"
                          text={
                            totalChangePercentage >= 0
                              ? "Scenario indicates positive demand movement. Consider preparing inventory and regional supply."
                              : "Scenario indicates reduced demand. Review purchasing and avoid overstocking."
                          }
                        />

                        <InsightCard
                          title="Inventory Recommendation"
                          text={
                            totalChangePercentage > 5
                              ? "Increase inventory for high-performing products before the forecast period."
                              : "Maintain controlled inventory and monitor demand changes."
                          }
                        />

                        <InsightCard
                          title="Business Impact"
                          text="Use this scenario to support pricing, marketing, procurement, and stock allocation decisions."
                        />

                        <InsightCard
                          title="Risk Signal"
                          text={
                            totalChangePercentage < 0
                              ? "Potential revenue decline detected. Analyze declining products and regions."
                              : "Low immediate risk detected, but monitor demand volatility."
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                <Brain className="mx-auto mb-4" size={42} />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  Select a Scenario
                </h3>
                <p className="mt-2">
                  Choose a scenario from the list to view details and generate a
                  what-if forecast.
                </p>
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <ScenarioCreateModal
            newScenario={newScenario}
            setNewScenario={setNewScenario}
            onClose={() => setShowCreateModal(false)}
            onCreate={createScenario}
          />
        )}

        {showTemplateModal && (
          <TemplateModal
            templates={predefinedScenarios}
            onUseTemplate={createFromTemplate}
            onClose={() => setShowTemplateModal(false)}
          />
        )}
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

function KpiCard({ title, value, icon, color, small = false }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3
            className={`mt-3 font-extrabold text-slate-900 dark:text-white ${
              small ? "text-xl" : "text-4xl"
            }`}
          >
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

function ScenarioCard({ scenario, selected, onSelect, onClone, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border p-5 transition ${
        selected
          ? "border-blue-600 bg-blue-50 shadow-lg dark:bg-blue-950/30"
          : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            {scenario.name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {scenario.description || "No description"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            scenario.is_published
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {scenario.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          {scenario.scenario_type}
        </span>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClone();
            }}
            className="rounded-xl bg-white p-2 text-blue-600 hover:bg-blue-100 dark:bg-slate-900"
          >
            <Copy size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-xl bg-white p-2 text-red-600 hover:bg-red-100 dark:bg-slate-900"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function VariableCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label.replace(/_/g, " ")}
      </p>

      <h4 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
        {String(value)}
      </h4>
    </div>
  );
}

function ImpactCard({ title, value, positive = false, neutral = false }) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow ${
        neutral
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : positive
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <div className="flex items-center gap-3">
        {neutral ? (
          <BarChart3 size={24} />
        ) : positive ? (
          <TrendingUp size={24} />
        ) : (
          <TrendingDown size={24} />
        )}

        <p className="text-sm font-semibold">{title}</p>
      </div>

      <h3 className="mt-3 text-3xl font-extrabold">{value}</h3>
    </div>
  );
}

function InsightCard({ title, text }) {
  return (
    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
      <h4 className="font-bold">{title}</h4>
      <p className="mt-2 text-sm text-blue-100">{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
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

function ScenarioCreateModal({
  newScenario,
  setNewScenario,
  onClose,
  onCreate,
}) {
  const updateVariable = (key, value) => {
    setNewScenario({
      ...newScenario,
      variables: {
        ...newScenario.variables,
        [key]: Number(value),
      },
    });
  };

  return (
    <ModalWrapper>
      <ModalHeader
        title="Create Scenario"
        subtitle="Adjust demand assumptions and save a new what-if scenario."
        onClose={onClose}
      />

      <div className="mt-6 space-y-5">
        <InputBlock
          label="Scenario Name"
          value={newScenario.name}
          onChange={(value) =>
            setNewScenario({ ...newScenario, name: value })
          }
        />

        <TextareaBlock
          label="Description"
          value={newScenario.description}
          onChange={(value) =>
            setNewScenario({ ...newScenario, description: value })
          }
        />

        <SelectBlock
          label="Scenario Type"
          value={newScenario.scenario_type}
          onChange={(value) =>
            setNewScenario({ ...newScenario, scenario_type: value })
          }
        />

        <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950">
          <h4 className="font-bold text-slate-900 dark:text-white">
            Scenario Variables
          </h4>

          <RangeInput
            label="Sales Growth (%)"
            min="-50"
            max="100"
            value={newScenario.variables.sales_growth}
            onChange={(value) => updateVariable("sales_growth", value)}
          />

          <RangeInput
            label="Seasonality Factor"
            min="0.5"
            max="2"
            step="0.1"
            value={newScenario.variables.seasonality}
            onChange={(value) => updateVariable("seasonality", value)}
          />

          <RangeInput
            label="Market Share (%)"
            min="-30"
            max="50"
            value={newScenario.variables.market_share}
            onChange={(value) => updateVariable("market_share", value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={onCreate}
            className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            Create Scenario
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function TemplateModal({ templates, onUseTemplate, onClose }) {
  return (
    <ModalWrapper wide>
      <ModalHeader
        title="Scenario Templates"
        subtitle="Start from a predefined planning strategy."
        onClose={onClose}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {templates.length === 0 ? (
          <EmptyState text="No templates available." />
        ) : (
          templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onUseTemplate(template.id, template.name)}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950"
            >
              <h4 className="font-bold text-slate-900 dark:text-white">
                {template.name}
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                {template.description}
              </p>
            </button>
          ))
        )}
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900 ${
          wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
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
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
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
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <textarea
        rows="3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </div>
  );
}

function SelectBlock({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      >
        <option value="custom">Custom</option>
        <option value="optimistic">Optimistic</option>
        <option value="pessimistic">Pessimistic</option>
        <option value="conservative">Conservative</option>
      </select>
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default ScenarioPlanningPage;