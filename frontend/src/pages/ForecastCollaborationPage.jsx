import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function ForecastCollaborationPage() {
  const { projectId } = useParams();

  const [forecasts, setForecasts] = useState([]);
  const [selectedForecast, setSelectedForecast] = useState("");

  const [comments, setComments] = useState([]);
  const [revisions, setRevisions] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [revisionSummary, setRevisionSummary] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchForecasts();
  }, [projectId]);

  useEffect(() => {
    if (selectedForecast) {
      fetchComments(selectedForecast);
      fetchRevisions(selectedForecast);
    }
  }, [selectedForecast]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);

      const response = await API.get("/forecast/history/my-history");

      setForecasts(response.data || []);

      if (response.data?.length > 0) {
        setSelectedForecast(response.data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (forecastId) => {
    try {
      const response = await API.get(
        `/forecast-collaboration/comments/${forecastId}`
      );

      setComments(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRevisions = async (forecastId) => {
    try {
      const response = await API.get(
        `/forecast-collaboration/revisions/${forecastId}`
      );

      setRevisions(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      await API.post(
        `/forecast-collaboration/comments/${selectedForecast}`,
        {
          comment: commentText,
        }
      );

      setCommentText("");
      fetchComments(selectedForecast);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;

    try {
      await API.delete(
        `/forecast-collaboration/comments/${commentId}`
      );

      fetchComments(selectedForecast);
    } catch (error) {
      console.error(error);
    }
  };

  const createRevision = async () => {
    try {
      await API.post(
        `/forecast-collaboration/revisions/${selectedForecast}`,
        {
          change_summary:
            revisionSummary || "Forecast revision saved",
        }
      );

      setRevisionSummary("");
      fetchRevisions(selectedForecast);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRevision = async (revisionId) => {
    if (!window.confirm("Delete revision?")) return;

    try {
      await API.delete(
        `/forecast-collaboration/revisions/${revisionId}`
      );

      fetchRevisions(selectedForecast);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold">
            Forecast Collaboration Center
          </h1>

          <p className="mt-2 text-blue-100">
            Collaborate on forecasts, add comments,
            track revisions and maintain decision history.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">

          <h2 className="text-xl font-bold mb-4">
            Select Forecast
          </h2>

          {loading ? (
            <p>Loading forecasts...</p>
          ) : (
            <select
              value={selectedForecast}
              onChange={(e) =>
                setSelectedForecast(e.target.value)
              }
              className="w-full border rounded-xl p-3"
            >
              <option value="">
                Select forecast
              </option>

              {forecasts.map((forecast) => (
                <option
                  key={forecast.id}
                  value={forecast.id}
                >
                  #{forecast.id} - {forecast.model_name} -
                  Dataset {forecast.dataset_id}
                </option>
              ))}
            </select>
          )}

        </div>

        {selectedForecast && (
          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-white rounded-3xl shadow p-6">

              <h2 className="text-xl font-bold mb-4">
                Forecast Comments
              </h2>

              <textarea
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
                placeholder="Write your comment..."
                rows="4"
                className="w-full border rounded-xl p-3 mb-4"
              />

              <button
                onClick={addComment}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl"
              >
                Add Comment
              </button>

              <div className="mt-6 space-y-3">

                {comments.length === 0 ? (
                  <p className="text-gray-500">
                    No comments yet.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-slate-50 rounded-xl p-4"
                    >
                      <p className="text-gray-700">
                        {comment.comment}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(
                          comment.created_at
                        ).toLocaleString()}
                      </p>

                      <button
                        onClick={() =>
                          deleteComment(comment.id)
                        }
                        className="text-red-600 text-sm mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}

              </div>

            </div>

            <div className="bg-white rounded-3xl shadow p-6">

              <h2 className="text-xl font-bold mb-4">
                Forecast Revision History
              </h2>

              <input
                value={revisionSummary}
                onChange={(e) =>
                  setRevisionSummary(e.target.value)
                }
                placeholder="Revision summary"
                className="w-full border rounded-xl p-3 mb-4"
              />

              <button
                onClick={createRevision}
                className="bg-green-600 text-white px-5 py-3 rounded-xl"
              >
                Save Revision
              </button>

              <div className="mt-6 space-y-3">

                {revisions.length === 0 ? (
                  <p className="text-gray-500">
                    No revisions yet.
                  </p>
                ) : (
                  revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="bg-slate-50 rounded-xl p-4"
                    >
                      <h3 className="font-bold">
                        Revision V{revision.revision_number}
                      </h3>

                      <p className="text-gray-600 mt-1">
                        {revision.change_summary}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(
                          revision.created_at
                        ).toLocaleString()}
                      </p>

                      <button
                        onClick={() =>
                          deleteRevision(revision.id)
                        }
                        className="text-red-600 text-sm mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </PageLayout>
  );
}

export default ForecastCollaborationPage;