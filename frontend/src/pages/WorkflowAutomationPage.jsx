import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Workflow,
  PlayCircle,
  History,
  RefreshCw,
  Plus,
} from "lucide-react";

function WorkflowAutomationPage() {
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);

  const [formData, setFormData] = useState({
    organization_id: "",
    workflow_name: "",
    workflow_type: "forecast_generation",
    trigger_type: "manual",
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await API.get("/workflows/my-workflows");
      setWorkflows(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createWorkflow = async () => {
    try {
      await API.post("/workflows/create", {
        organization_id: formData.organization_id
          ? Number(formData.organization_id)
          : null,
        workflow_name: formData.workflow_name,
        workflow_type: formData.workflow_type,
        trigger_type: formData.trigger_type,
      });

      setFormData({
        organization_id: "",
        workflow_name: "",
        workflow_type: "forecast_generation",
        trigger_type: "manual",
      });

      fetchWorkflows();
      alert("Workflow created successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const executeWorkflow = async (workflowId) => {
    try {
      await API.post(`/workflows/${workflowId}/execute`);
      alert("Workflow executed successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async (workflowId) => {
    try {
      const res = await API.get(`/workflows/${workflowId}/logs`);
      setLogs(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-purple-100">
            Enterprise Automation
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Workflow Automation Center
          </h1>

          <p className="mt-3 text-purple-100">
            Automate forecast generation, reporting, notifications,
            and business workflows.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={20} />
              <h2 className="text-xl font-bold">
                Create Workflow
              </h2>
            </div>

            <div className="space-y-4">

              <input
                type="number"
                placeholder="Organization ID (optional)"
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organization_id: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                placeholder="Workflow Name"
                value={formData.workflow_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workflow_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={formData.workflow_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workflow_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="forecast_generation">
                  Forecast Generation
                </option>

                <option value="report_generation">
                  Report Generation
                </option>

                <option value="notification">
                  Notification
                </option>

                <option value="custom">
                  Custom Workflow
                </option>
              </select>

              <select
                value={formData.trigger_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trigger_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="manual">
                  Manual
                </option>

                <option value="schedule">
                  Scheduled
                </option>

                <option value="event">
                  Event Triggered
                </option>
              </select>

              <button
                onClick={createWorkflow}
                className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
              >
                Create Workflow
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow size={20} />
                <h2 className="text-xl font-bold">
                  Workflow Library
                </h2>
              </div>

              <button
                onClick={fetchWorkflows}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                No workflows created.
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="rounded-2xl border bg-slate-50 p-5"
                  >
                    <h3 className="font-bold text-lg">
                      {workflow.workflow_name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Type: {workflow.workflow_type}
                    </p>

                    <p className="text-sm text-slate-500">
                      Trigger: {workflow.trigger_type}
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() =>
                          executeWorkflow(workflow.id)
                        }
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white"
                      >
                        <PlayCircle size={16} />
                        Execute
                      </button>

                      <button
                        onClick={() =>
                          fetchLogs(workflow.id)
                        }
                        className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2"
                      >
                        <History size={16} />
                        Logs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            Workflow Execution Logs
          </h2>

          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              Select a workflow to view logs.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <p className="font-semibold">
                    {log.execution_status}
                  </p>

                  <p className="text-sm text-slate-500">
                    {log.execution_message}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    {log.started_at}
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

export default WorkflowAutomationPage;