import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Shield,
  Activity,
  RefreshCw,
} from "lucide-react";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        API.get("/audit-logs/my-logs"),
        API.get("/audit-logs/summary"),
      ]);

      setLogs(logsRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-gray-900 to-black p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-300">
            Enterprise Audit System
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Organization Audit Logs
          </h1>

          <p className="mt-3 text-gray-300">
            Track activities, governance actions,
            workflow executions and enterprise events.
          </p>
        </div>

        {summary && (
          <div className="grid gap-5 md:grid-cols-2">

            <div className="rounded-3xl bg-white p-6 shadow">
              <p className="text-sm text-slate-500">
                Total Audit Logs
              </p>

              <h2 className="mt-2 text-4xl font-extrabold">
                {summary.total_logs}
              </h2>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <p className="text-sm text-slate-500">
                Active Modules
              </p>

              <h2 className="mt-2 text-4xl font-extrabold">
                {Object.keys(summary.modules || {}).length}
              </h2>
            </div>

          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow">

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={20} />
              <h2 className="text-xl font-bold">
                Audit Timeline
              </h2>
            </div>

            <button
              onClick={loadData}
              className="rounded-xl bg-slate-100 p-2"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              No audit logs available.
            </div>
          ) : (
            <div className="space-y-4">

              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between">

                    <div>
                      <h3 className="font-bold">
                        {log.action}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {log.module_name}
                      </p>
                    </div>

                    <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                      #{log.id}
                    </div>

                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {log.description || "No description"}
                  </p>

                  <div className="mt-4 flex justify-between text-xs text-slate-400">
                    <span>
                      User ID: {log.user_id}
                    </span>

                    <span>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

        {summary && (
          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center gap-2">
              <Shield size={20} />
              <h2 className="text-xl font-bold">
                Module Activity Summary
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">

              {Object.entries(summary.modules || {}).map(
                ([module, count]) => (
                  <div
                    key={module}
                    className="rounded-2xl bg-slate-50 p-5"
                  >
                    <p className="text-sm text-slate-500">
                      {module}
                    </p>

                    <h3 className="mt-2 text-3xl font-bold">
                      {count}
                    </h3>
                  </div>
                )
              )}

            </div>

          </div>
        )}

      </div>
    </PageLayout>
  );
}

export default AuditLogsPage;