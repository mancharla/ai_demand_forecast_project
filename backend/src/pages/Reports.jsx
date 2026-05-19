import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function Reports() {
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPreview();
  }, []);

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      setError("");

      const response = await API.get("/reports/preview");

      setPreview(response.data);
    } catch (error) {
      console.log(error.response);

      setError(
        error.response?.data?.detail ||
          "Unable to load report preview"
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const downloadFile = async (url, filename, type) => {
    try {
      if (type === "excel") setLoadingExcel(true);
      if (type === "pdf") setLoadingPdf(true);

      const response = await API.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.log(error.response);

      alert(
        error.response?.data?.detail ||
          "Download failed. Generate forecast first."
      );
    } finally {
      setLoadingExcel(false);
      setLoadingPdf(false);
    }
  };

  const openPdfInBrowser = async () => {
    try {
      setLoadingPdf(true);

      const response = await API.get("/reports/dashboard/pdf", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileURL = window.URL.createObjectURL(blob);

      window.open(fileURL, "_blank");
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Unable to open PDF report"
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const StatCard = ({ title, value, color }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <p className="text-gray-500">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </h2>
    </div>
  );

  const ActionCard = ({
    icon,
    title,
    description,
    buttonText,
    buttonColor,
    onClick,
    loading,
  }) => (
    <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition">
      <div className="text-5xl mb-5">{icon}</div>

      <h2 className="text-2xl font-bold mb-3">
        {title}
      </h2>

      <p className="text-gray-500 mb-6">
        {description}
      </p>

      <button
        onClick={onClick}
        disabled={loading}
        className={`w-full text-white py-4 rounded-2xl font-bold transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : buttonColor
        }`}
      >
        {loading ? "Preparing..." : buttonText}
      </button>
    </div>
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold">
            Reports Center
          </h1>

          <p className="mt-3 text-blue-100">
            Preview, open, and download your forecasting reports.
          </p>
        </div>

        {loadingPreview && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <LoadingSpinner text="Loading report preview..." />
          </div>
        )}

        {error && !loadingPreview && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5">
            <h2 className="font-bold mb-1">
              Report preview not available
            </h2>

            <p>{error}</p>

            <p className="mt-2 text-sm">
              Upload a dataset and generate forecast first.
            </p>
          </div>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="User"
                value={preview.user_name || "User"}
                color="text-blue-600"
              />

              <StatCard
                title="Total Sales"
                value={`₹ ${preview.total_sales || 0}`}
                color="text-green-600"
              />

              <StatCard
                title="Total Products"
                value={preview.total_products || 0}
                color="text-purple-600"
              />

              <StatCard
                title="Forecast Count"
                value={preview.forecast_count || 0}
                color="text-red-600"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">
                  Forecast Report Preview
                </h2>

                <button
                  onClick={fetchPreview}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700"
                >
                  Refresh Preview
                </button>
              </div>

              {preview.forecast_data &&
              preview.forecast_data.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={preview.forecast_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="predicted_sales"
                      fill="#2563eb"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="bg-gray-50 text-gray-600 p-6 rounded-2xl">
                  No forecast data found. Generate forecast first.
                </div>
              )}
            </div>

            {preview.forecast_data &&
              preview.forecast_data.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
                  <h2 className="text-2xl font-bold mb-6">
                    Forecast Data Preview
                  </h2>

                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left">
                          Product
                        </th>
                        <th className="p-3 text-left">
                          Predicted Sales
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {preview.forecast_data.map((item, index) => (
                        <tr
                          key={index}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-3">
                            {item.product}
                          </td>

                          <td className="p-3">
                            ₹ {item.predicted_sales}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <ActionCard
            icon="📊"
            title="Download Excel Report"
            description="Download product-wise forecast data with Excel chart."
            buttonText="Download Excel"
            buttonColor="bg-green-600 hover:bg-green-700"
            loading={loadingExcel}
            onClick={() =>
              downloadFile(
                "/reports/forecast/excel",
                "forecast_report.xlsx",
                "excel"
              )
            }
          />

          <ActionCard
            icon="📄"
            title="Download PDF Report"
            description="Download dashboard analytics and forecast summary as PDF."
            buttonText="Download PDF"
            buttonColor="bg-red-600 hover:bg-red-700"
            loading={loadingPdf}
            onClick={() =>
              downloadFile(
                "/reports/dashboard/pdf",
                "dashboard_report.pdf",
                "pdf"
              )
            }
          />

          <ActionCard
            icon="👁️"
            title="Open PDF Preview"
            description="Open the generated dashboard PDF report in a new browser tab."
            buttonText="Open PDF"
            buttonColor="bg-blue-600 hover:bg-blue-700"
            loading={loadingPdf}
            onClick={openPdfInBrowser}
          />
        </div>
      </div>
    </PageLayout>
  );
}

export default Reports;