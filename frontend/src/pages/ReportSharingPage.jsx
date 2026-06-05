import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Share2,
  Mail,
  FileText,
  Trash2,
  RefreshCw,
  Send,
} from "lucide-react";

function ReportSharingPage() {
  const [reports, setReports] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    report_id: "",
    report_type: "executive_report",
    recipient_email: "",
    share_message: "",
  });

  useEffect(() => {
    fetchReports();
    fetchShares();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await API.get("/executive-reports/project/1");
      setReports(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await API.get("/report-sharing/my-shares");
      setShares(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!formData.report_id) {
      alert("Please select a report");
      return;
    }

    if (!formData.recipient_email.trim()) {
      alert("Please enter recipient email");
      return;
    }

    try {
      await API.post("/report-sharing/share", {
        ...formData,
        report_id: Number(formData.report_id),
      });

      setFormData({
        report_id: "",
        report_type: "executive_report",
        recipient_email: "",
        share_message: "",
      });

      fetchShares();
      alert("Report shared successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to share report");
    }
  };

  const deleteShare = async (shareId) => {
    if (!window.confirm("Delete this share record?")) return;

    try {
      await API.delete(`/report-sharing/${shareId}`);
      fetchShares();
    } catch (error) {
      console.error(error);
      alert("Failed to delete share record");
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Collaboration
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Report Sharing Center
          </h1>

          <p className="mt-3 max-w-3xl text-blue-100">
            Share executive reports with managers, stakeholders, and team
            members.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Share2 size={20} />
              <h2 className="text-xl font-bold">Share Report</h2>
            </div>

            <div className="space-y-4">
              <select
                value={formData.report_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    report_id: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="">Select Executive Report</option>

                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    #{report.id} - {report.title}
                  </option>
                ))}
              </select>

              <input
                type="email"
                value={formData.recipient_email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipient_email: e.target.value,
                  })
                }
                placeholder="Recipient email"
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                rows="4"
                value={formData.share_message}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    share_message: e.target.value,
                  })
                }
                placeholder="Optional message"
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={shareReport}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                <Send size={18} />
                Share Report
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={20} />
                <h2 className="text-xl font-bold">Shared Reports History</h2>
              </div>

              <button
                onClick={fetchShares}
                className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-500">
                Loading shares...
              </div>
            ) : shares.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                No shared reports yet.
              </div>
            ) : (
              <div className="space-y-4">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="rounded-2xl border bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText size={17} />
                          <h3 className="font-bold">
                            Report #{share.report_id}
                          </h3>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          Shared with: {share.recipient_email}
                        </p>

                        {share.share_message && (
                          <p className="mt-2 text-sm text-slate-500">
                            Message: {share.share_message}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          {share.shared_at
                            ? new Date(share.shared_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteShare(share.id)}
                        className="rounded-xl bg-red-100 p-2 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default ReportSharingPage;