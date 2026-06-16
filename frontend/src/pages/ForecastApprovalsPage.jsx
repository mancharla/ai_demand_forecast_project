import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  ClipboardCheck,
} from "lucide-react";

function ForecastApprovalsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    forecast_id: "",
    organization_id: "",
    comments: "",
  });

  const [reviewRemarks, setReviewRemarks] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, pendingRes] = await Promise.all([
        API.get("/forecast-approvals/my-submissions"),
        API.get("/forecast-approvals/pending"),
      ]);

      setSubmissions(subRes.data || []);
      setPending(pendingRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const submitApproval = async () => {
    if (!formData.forecast_id) {
      alert("Forecast ID required");
      return;
    }

    try {
      await API.post("/forecast-approvals/submit", {
        forecast_id: Number(formData.forecast_id),
        organization_id: formData.organization_id
          ? Number(formData.organization_id)
          : null,
        comments: formData.comments,
      });

      setFormData({
        forecast_id: "",
        organization_id: "",
        comments: "",
      });

      fetchData();
      alert("Forecast submitted for approval");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to submit approval");
    }
  };

  const reviewApproval = async (approvalId, status) => {
    try {
      await API.put(`/forecast-approvals/${approvalId}/review`, {
        status,
        remarks: reviewRemarks,
      });

      setReviewRemarks("");
      fetchData();
      alert(`Forecast ${status}`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to review");
    }
  };

  const fetchHistory = async (approvalId) => {
    try {
      const res = await API.get(`/forecast-approvals/${approvalId}/history`);
      setHistory(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const statusBadge = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Forecast Governance
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Forecast Approval Workflow
          </h1>

          <p className="mt-3 max-w-3xl text-blue-100">
            Analysts submit forecasts for review. Managers and admins can
            approve or reject forecasts with complete audit history.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Send size={20} />
              <h2 className="text-xl font-bold">Submit Forecast</h2>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                value={formData.forecast_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    forecast_id: e.target.value,
                  })
                }
                placeholder="Forecast ID"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="number"
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organization_id: e.target.value,
                  })
                }
                placeholder="Organization ID optional"
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                value={formData.comments}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comments: e.target.value,
                  })
                }
                placeholder="Submission comments"
                rows="4"
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={submitApproval}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                <Send size={18} />
                Submit for Approval
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <h2 className="text-xl font-bold">Pending Approvals</h2>
              </div>

              <button
                onClick={fetchData}
                className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <textarea
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="Review remarks"
              rows="3"
              className="mb-5 w-full rounded-xl border px-4 py-3"
            />

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                No pending approvals.
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-bold">
                          Forecast #{item.forecast_id}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Submitted by User #{item.submitted_by}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.comments || "No comments"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold ${statusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => reviewApproval(item.id, "approved")}
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-bold text-white"
                      >
                        <CheckCircle size={17} />
                        Approve
                      </button>

                      <button
                        onClick={() => reviewApproval(item.id, "rejected")}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                      >
                        <XCircle size={17} />
                        Reject
                      </button>

                      <button
                        onClick={() => fetchHistory(item.id)}
                        className="rounded-xl bg-slate-200 px-4 py-2 font-bold text-slate-700"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardCheck size={20} />
              <h2 className="text-xl font-bold">My Submissions</h2>
            </div>

            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                No submissions found.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center"
                  >
                    <div>
                      <p className="font-bold">Forecast #{item.forecast_id}</p>
                      <p className="text-sm text-slate-500">
                        {item.comments || "No comments"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold ${statusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-5 text-xl font-bold">Approval History</h2>

            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                Select History from pending approvals.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-bold">{item.action}</p>
                    <p className="text-sm text-slate-500">
                      By User #{item.action_by}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.remarks || "No remarks"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ForecastApprovalsPage;