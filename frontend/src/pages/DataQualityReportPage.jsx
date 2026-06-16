import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  FileBarChart,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

function DataQualityReportPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const res = await API.get(
        "/data-quality/report-summary"
      );

      setSummary(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-green-100">
            Data Quality Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Data Quality Reports
          </h1>

          <p className="mt-3 text-green-100">
            Monitor dataset quality, validation scores,
            and enterprise data health.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={loadSummary}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {summary && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <Card
              title="Total Reports"
              value={summary.total_reports}
              icon={<FileBarChart size={22} />}
            />

            <Card
              title="Average Score"
              value={`${summary.average_score}%`}
              icon={<Star size={22} />}
            />

            <Card
              title="Excellent"
              value={summary.excellent_reports}
              icon={<CheckCircle size={22} />}
            />

            <Card
              title="Poor"
              value={summary.poor_reports}
              icon={<AlertTriangle size={22} />}
            />

          </div>
        )}

        {summary && (
          <div className="rounded-3xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Quality Assessment Summary
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <Info
                label="Average Quality Score"
                value={`${summary.average_score}%`}
              />

              <Info
                label="Excellent Datasets"
                value={summary.excellent_reports}
              />

              <Info
                label="Poor Datasets"
                value={summary.poor_reports}
              />

              <Info
                label="Total Reports"
                value={summary.total_reports}
              />

            </div>

          </div>
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

        <div className="rounded-2xl bg-green-100 p-3 text-green-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

export default DataQualityReportPage;