import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ModelPerformancePage() {
  const { projectId } = useParams();

  const [performance, setPerformance] = useState([]);
  const [bestModel, setBestModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, [projectId]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/model-performance/project/${projectId}`);
      setPerformance(response.data || []);

      try {
        const bestResponse = await API.get(
          `/model-performance/best-model/${projectId}`
        );
        setBestModel(bestResponse.data);
      } catch {
        setBestModel(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePerformance = async () => {
    try {
      setGenerating(true);

      await API.post(`/model-performance/generate/${projectId}`);
      await fetchPerformance();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to generate performance");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Forecast Accuracy Center
              </p>

              <h1 className="mt-3 text-4xl font-extrabold">
                Model Performance Dashboard
              </h1>

              <p className="mt-3 max-w-3xl text-blue-100">
                Track model accuracy, compare MAE/RMSE/MAPE, identify best
                model, and monitor forecasting quality.
              </p>
            </div>

            <button
              onClick={generatePerformance}
              disabled={generating}
              className="rounded-2xl bg-white px-6 py-4 font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Performance"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow">
            Loading model performance...
          </div>
        ) : performance.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <h2 className="text-2xl font-bold text-slate-800">
              No Model Performance Found
            </h2>
            <p className="mt-2 text-slate-500">
              Click Generate Performance to create model accuracy records.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-4">
              <KpiCard
                title="Best Model"
                value={bestModel?.model_name || "N/A"}
                color="from-blue-500 to-cyan-500"
              />

              <KpiCard
                title="Best Accuracy"
                value={`${Number(bestModel?.accuracy_score || 0).toFixed(2)}%`}
                color="from-green-500 to-emerald-500"
              />

              <KpiCard
                title="Lowest MAPE"
                value={`${Number(bestModel?.mape || 0).toFixed(2)}%`}
                color="from-purple-500 to-indigo-500"
              />

              <KpiCard
                title="Models Compared"
                value={performance.length}
                color="from-orange-500 to-red-500"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-slate-900">
                Accuracy Comparison
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Higher accuracy and lower error metrics indicate better model
                performance.
              </p>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="accuracy_score"
                      name="Accuracy %"
                      fill="#2563eb"
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      dataKey="mape"
                      name="MAPE %"
                      fill="#f97316"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow overflow-x-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Model Ranking
              </h2>

              <table className="w-full border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-left">Rank</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">MAE</th>
                    <th className="p-3 text-left">RMSE</th>
                    <th className="p-3 text-left">MAPE</th>
                    <th className="p-3 text-left">Accuracy</th>
                  </tr>
                </thead>

                <tbody>
                  {performance.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-bold">#{item.model_rank}</td>
                      <td className="p-3">{item.model_name}</td>
                      <td className="p-3">{Number(item.mae || 0).toFixed(2)}</td>
                      <td className="p-3">{Number(item.rmse || 0).toFixed(2)}</td>
                      <td className="p-3">{Number(item.mape || 0).toFixed(2)}%</td>
                      <td className="p-3 font-bold text-green-600">
                        {Number(item.accuracy_score || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
      <div
        className={`mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br ${color}`}
      />

      <p className="text-sm font-semibold text-slate-500">{title}</p>

      <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
        {value}
      </h3>
    </div>
  );
}

export default ModelPerformancePage;