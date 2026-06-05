import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function AIInsightsPage() {
  const { projectId } = useParams();

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [projectId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/ai-insights/project/${projectId}`
      );

      setInsights(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);

      await API.post(
        `/ai-insights/generate/${projectId}`
      );

      await fetchInsights();
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const acknowledgeInsight = async (id) => {
    try {
      await API.put(
        `/ai-insights/${id}/acknowledge`
      );

      fetchInsights();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteInsight = async (id) => {
    if (!window.confirm("Delete this insight?")) return;

    try {
      await API.delete(`/ai-insights/${id}`);

      fetchInsights();
    } catch (error) {
      console.error(error);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-700";

      case "medium":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-green-100 text-green-700";
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-8 text-white shadow-xl">

          <div className="flex justify-between items-center">

            <div>
              <h1 className="text-4xl font-bold">
                AI Business Insights
              </h1>

              <p className="mt-2 text-blue-100">
                Automated recommendations, opportunities,
                risks, and demand intelligence.
              </p>
            </div>

            <button
              onClick={generateInsights}
              disabled={generating}
              className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold"
            >
              {generating
                ? "Generating..."
                : "Generate Insights"}
            </button>

          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            Loading insights...
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            No insights available.
          </div>
        ) : (
          <div className="grid gap-6">

            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white rounded-3xl shadow p-6"
              >
                <div className="flex justify-between items-start">

                  <div>

                    <h2 className="text-xl font-bold">
                      {insight.title}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      {insight.description}
                    </p>

                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getImpactColor(
                      insight.impact_level
                    )}`}
                  >
                    {insight.impact_level}
                  </span>

                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">

                  <div className="bg-slate-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Confidence Score
                    </p>

                    <h3 className="text-2xl font-bold text-blue-600">
                      {(
                        insight.confidence_score * 100
                      ).toFixed(0)}
                      %
                    </h3>

                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Recommendation
                    </p>

                    <h3 className="font-semibold">
                      {insight.recommended_action}
                    </h3>

                  </div>

                </div>

                <div className="flex gap-3 mt-6">

                  {!insight.is_acknowledged && (
                    <button
                      onClick={() =>
                        acknowledgeInsight(insight.id)
                      }
                      className="bg-green-600 text-white px-5 py-2 rounded-xl"
                    >
                      Acknowledge
                    </button>
                  )}

                  <button
                    onClick={() =>
                      deleteInsight(insight.id)
                    }
                    className="bg-red-600 text-white px-5 py-2 rounded-xl"
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default AIInsightsPage;