import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import { FileText, RefreshCw, Target, TrendingUp } from "lucide-react";

function KPIReportPage() {
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    const res = await API.get("/kpi-management/list");
    setKpis(res.data || []);
  };

  const fetchReport = async () => {
    if (!selectedKpi) {
      alert("Select KPI");
      return;
    }

    const res = await API.get(`/kpi-management/${selectedKpi}/report`);
    setReport(res.data);
  };

  const status =
    report?.achievement_percentage >= 100
      ? "Achieved"
      : report?.achievement_percentage >= 80
      ? "On Track"
      : report?.achievement_percentage >= 60
      ? "At Risk"
      : "Needs Attention";

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-purple-100">
            KPI Reporting
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            KPI Performance Reports
          </h1>

          <p className="mt-3 text-purple-100">
            Generate KPI summary reports, achievement score, history count, and
            performance status.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row">
            <select
              value={selectedKpi}
              onChange={(e) => setSelectedKpi(e.target.value)}
              className="flex-1 rounded-xl border px-4 py-3"
            >
              <option value="">Select KPI</option>

              {kpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  #{kpi.id} - {kpi.kpi_name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchReport}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white"
            >
              <RefreshCw size={18} />
              Generate Report
            </button>
          </div>
        </div>

        {!report ? (
          <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow">
            Select a KPI and generate report.
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-4">
              <Card
                title="Target"
                value={report.target_value}
                icon={<Target size={22} />}
              />

              <Card
                title="Current"
                value={report.current_value}
                icon={<TrendingUp size={22} />}
              />

              <Card
                title="Achievement"
                value={`${report.achievement_percentage}%`}
                icon={<Target size={22} />}
              />

              <Card
                title="History Count"
                value={report.history_count}
                icon={<FileText size={22} />}
              />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="mb-5 text-xl font-bold">KPI Report Summary</h2>

              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">KPI Name</p>
                <h3 className="text-2xl font-bold">{report.kpi_name}</h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Info label="Target Value" value={report.target_value} />
                  <Info label="Current Value" value={report.current_value} />
                  <Info
                    label="Achievement %"
                    value={`${report.achievement_percentage}%`}
                  />
                  <Info label="Performance Status" value={status} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
        </div>

        <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

export default KPIReportPage;