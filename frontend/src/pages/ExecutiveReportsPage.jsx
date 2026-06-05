import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function ExecutiveReportsPage() {
  const { projectId } = useParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/executive-reports/project/${projectId}`
      );

      setReports(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);

      await API.post(
        `/executive-reports/generate/${projectId}`
      );

      fetchReports();
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete report?")) return;

    try {
      await API.delete(`/executive-reports/${id}`);
      fetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 p-8 text-white">

          <div className="flex justify-between items-center">

            <div>
              <h1 className="text-4xl font-bold">
                Executive Reports
              </h1>

              <p className="mt-2 text-green-100">
                Business intelligence, revenue outlook,
                profitability analysis and executive summaries.
              </p>
            </div>

            <button
              onClick={generateReport}
              disabled={generating}
              className="bg-white text-green-700 px-6 py-3 rounded-xl font-bold"
            >
              {generating
                ? "Generating..."
                : "Generate Report"}
            </button>

          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-12 text-center">
            No executive reports available.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl shadow p-6"
            >

              <div className="flex justify-between items-start">

                <div>
                  <h2 className="text-2xl font-bold">
                    {report.title}
                  </h2>

                  <p className="text-gray-500 mt-1">
                    {report.report_type}
                  </p>
                </div>

                <button
                  onClick={() =>
                    deleteReport(report.id)
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>

              </div>

              <div className="mt-6 bg-slate-50 rounded-xl p-5">
                <h3 className="font-bold">
                  Executive Summary
                </h3>

                <p className="mt-3 text-gray-700">
                  {report.summary}
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-6">

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Revenue
                  </p>

                  <h3 className="text-xl font-bold text-blue-700">
                    ₹
                    {report.revenue_forecast
                      ?.current_revenue?.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Forecast Revenue
                  </p>

                  <h3 className="text-xl font-bold text-green-700">
                    ₹
                    {report.revenue_forecast
                      ?.forecast_revenue?.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Profit
                  </p>

                  <h3 className="text-xl font-bold text-purple-700">
                    ₹
                    {report.profit_forecast
                      ?.current_profit?.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Forecast Profit
                  </p>

                  <h3 className="text-xl font-bold text-orange-700">
                    ₹
                    {report.profit_forecast
                      ?.forecast_profit?.toLocaleString()}
                  </h3>
                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold mb-3">
                    Key Findings
                  </h3>

                  <ul className="space-y-2">
                    {report.key_findings?.map(
                      (item, index) => (
                        <li key={index}>
                          • {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold mb-3">
                    Recommendations
                  </h3>

                  <ul className="space-y-2">
                    {report.recommendations?.map(
                      (item, index) => (
                        <li key={index}>
                          • {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

              </div>

            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
}

export default ExecutiveReportsPage;