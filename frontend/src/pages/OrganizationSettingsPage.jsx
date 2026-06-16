import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import { Settings, Save, Building2 } from "lucide-react";

function OrganizationSettingsPage() {
  const { organizationId } = useParams();

  const [settings, setSettings] = useState({
    currency: "INR",
    timezone: "Asia/Kolkata",
    default_forecast_days: "30",
    default_model: "best",
    email_notifications: "enabled",
    in_app_notifications: "enabled",
  });

  useEffect(() => {
    fetchSettings();
  }, [organizationId]);

  const fetchSettings = async () => {
    try {
      const res = await API.get(`/organizations/${organizationId}/settings/all`);

      setSettings((prev) => ({
        ...prev,
        ...res.data,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const saveSettings = async () => {
    try {
      await API.put(`/organizations/${organizationId}/settings/bulk`, settings);
      alert("Organization settings saved successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to save settings");
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white/20 p-4">
              <Building2 size={34} />
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Organization Configuration
              </p>

              <h1 className="mt-2 text-4xl font-extrabold">
                Organization Settings
              </h1>

              <p className="mt-2 text-blue-100">
                Configure currency, timezone, forecasting defaults, and
                notification preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center gap-2">
            <Settings size={20} />
            <h2 className="text-xl font-bold">Forecasting Defaults</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Currency"
              value={settings.currency}
              onChange={(v) => setSettings({ ...settings, currency: v })}
            />

            <Field
              label="Timezone"
              value={settings.timezone}
              onChange={(v) => setSettings({ ...settings, timezone: v })}
            />

            <Field
              label="Default Forecast Days"
              value={settings.default_forecast_days}
              onChange={(v) =>
                setSettings({ ...settings, default_forecast_days: v })
              }
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                Default Model
              </label>

              <select
                value={settings.default_model}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_model: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="best">Best Model</option>
                <option value="linear_regression">Linear Regression</option>
                <option value="random_forest">Random Forest</option>
                <option value="xgboost">XGBoost</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                Email Notifications
              </label>

              <select
                value={settings.email_notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email_notifications: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                In-App Notifications
              </label>

              <select
                value={settings.in_app_notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    in_app_notifications: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
      />
    </div>
  );
}

export default OrganizationSettingsPage;