import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

function DataQualityPage() {
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [datasetId, setDatasetId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, reportsRes] = await Promise.all([
        API.get("/data-quality/dashboard"),
        API.get("/data-quality/reports"),
      ]);

      setDashboard(dashboardRes.data);
      setReports(reportsRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const analyzeDataset = async () => {
    if (!datasetId) {
      alert("Enter Dataset ID");
      return;
    }

    try {
      await API.post("/data-quality/analyze", {
        dataset_id: Number(datasetId),
      });

      setDatasetId("");
      fetchData();
      alert("Data quality analysis completed");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Analysis failed");
    }
  };

  const deleteReport = async (id) => {
    try {
      await API.delete(`/data-quality/reports/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const scoreColor = (score) => {
    if (score >= 85) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-green-100">
            Data Quality Management
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Dataset Quality Center
          </h1>

          <p className="mt-3 text-green-100">
            Detect missing values, duplicate rows,
            validation issues, and dataset quality risks.
          </p>
        </div>

        {dashboard && (
          <div className="grid gap-5 md:grid-cols-4">
            <Card title="Reports" value={dashboard.total_reports} />
            <Card title="Avg Score" value={dashboard.average_score} />
            <Card title="Excellent" value={dashboard.excellent} />
            <Card title="Warnings" value={dashboard.warning} />
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="number"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              placeholder="Dataset ID"
              className="flex-1 rounded-xl border px-4 py-3"
            />

            <button
              onClick={analyzeDataset}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
            >
              <Search size={18} />
              Analyze Dataset
            </button>

            <button
              onClick={fetchData}
              className="rounded-xl bg-slate-100 px-5 py-3"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            Quality Reports
          </h2>

          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              No quality reports found.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-bold">
                        Dataset #{report.dataset_id}
                      </h3>

                      <p className="text-sm text-slate-500">
                        Rows: {report.total_rows}
                      </p>

                      <p className="text-sm text-slate-500">
                        Columns: {report.total_columns}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 font-bold ${scoreColor(
                        report.quality_score
                      )}`}
                    >
                      {report.quality_score}%
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Info
                      label="Missing Values"
                      value={report.missing_values}
                    />

                    <Info
                      label="Duplicate Rows"
                      value={report.duplicate_rows}
                    />
                  </div>

                  <button
                    onClick={() => deleteReport(report.id)}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"
                  >
                    <Trash2 size={16} />
                    Delete Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
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

export default DataQualityPage;