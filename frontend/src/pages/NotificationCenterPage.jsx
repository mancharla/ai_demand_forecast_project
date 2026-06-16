import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import {
  Bell,
  Settings,
  Megaphone,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

function NotificationCenterPage() {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [preferences, setPreferences] = useState(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    role_target: "all",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notificationsRes, announcementsRes, preferencesRes] =
        await Promise.all([
          API.get("/notification-center/notifications"),
          API.get("/notification-center/announcements"),
          API.get("/notification-center/preferences"),
        ]);

      setNotifications(notificationsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setPreferences(preferencesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/notification-center/notifications/read-all");
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const savePreferences = async () => {
    try {
      await API.put(
        "/notification-center/preferences",
        preferences
      );

      alert("Preferences updated");
    } catch (error) {
      console.error(error);
    }
  };

  const createAnnouncement = async () => {
    try {
      await API.post(
        "/notification-center/announcements",
        announcementForm
      );

      setAnnouncementForm({
        title: "",
        message: "",
        role_target: "all",
      });

      loadData();

      alert("Announcement created");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-100">
            Enterprise Communication
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Notification Center
          </h1>

          <p className="mt-3 text-orange-100">
            Manage notifications, announcements,
            alerts and communication preferences.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h2 className="text-xl font-bold">
                  Notifications
                </h2>
              </div>

              <button
                onClick={markAllRead}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                Mark All Read
              </button>
            </div>

            <div className="space-y-3">

              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <p className="font-semibold">
                    {item.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {item.created_at}
                  </p>
                </div>
              ))}

            </div>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center gap-2">
              <Settings size={20} />
              <h2 className="text-xl font-bold">
                Preferences
              </h2>
            </div>

            {preferences && (
              <div className="space-y-4">

                <Toggle
                  label="Email Notifications"
                  value={preferences.email_enabled}
                  onChange={(v) =>
                    setPreferences({
                      ...preferences,
                      email_enabled: v,
                    })
                  }
                />

                <Toggle
                  label="In-App Notifications"
                  value={preferences.in_app_enabled}
                  onChange={(v) =>
                    setPreferences({
                      ...preferences,
                      in_app_enabled: v,
                    })
                  }
                />

                <Toggle
                  label="Forecast Alerts"
                  value={preferences.forecast_alerts}
                  onChange={(v) =>
                    setPreferences({
                      ...preferences,
                      forecast_alerts: v,
                    })
                  }
                />

                <Toggle
                  label="Approval Alerts"
                  value={preferences.approval_alerts}
                  onChange={(v) =>
                    setPreferences({
                      ...preferences,
                      approval_alerts: v,
                    })
                  }
                />

                <Toggle
                  label="Workflow Alerts"
                  value={preferences.workflow_alerts}
                  onChange={(v) =>
                    setPreferences({
                      ...preferences,
                      workflow_alerts: v,
                    })
                  }
                />

                <button
                  onClick={savePreferences}
                  className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white"
                >
                  Save Preferences
                </button>

              </div>
            )}

          </div>

        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">

          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center gap-2">
              <Megaphone size={20} />
              <h2 className="text-xl font-bold">
                Create Announcement
              </h2>
            </div>

            <div className="space-y-4">

              <input
                placeholder="Title"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                rows="4"
                placeholder="Message"
                value={announcementForm.message}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    message: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={announcementForm.role_target}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    role_target: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins</option>
                <option value="manager">Managers</option>
                <option value="analyst">Analysts</option>
              </select>

              <button
                onClick={createAnnouncement}
                className="w-full rounded-xl bg-orange-600 py-3 font-bold text-white"
              >
                Create Announcement
              </button>

            </div>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Organization Announcements
              </h2>

              <button
                onClick={loadData}
                className="rounded-xl bg-slate-100 p-2"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-4">

              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-50 p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-bold">
                      {item.title}
                    </h3>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {item.role_target}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {item.message}
                  </p>
                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </PageLayout>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <span>{label}</span>

      <button
        onClick={() => onChange(value ? 0 : 1)}
        className={`rounded-full px-4 py-2 text-white ${
          value ? "bg-green-600" : "bg-slate-400"
        }`}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );
}

export default NotificationCenterPage;