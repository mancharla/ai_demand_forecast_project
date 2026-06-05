import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  Play,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://localhost:8000";

const ForecastSchedulesPage = () => {
  const { projectId } = useParams();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    dataset_id: "",
    schedule_name: "",
    forecast_days: 30,
    interval_type: "daily",
    model_type: "best",
  });

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/forecast-schedules/my-schedules`,
        { headers }
      );

      setSchedules(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const createSchedule = async () => {
    try {
      await axios.post(
        `${API_URL}/forecast-schedules/create`,
        formData,
        { headers }
      );

      setFormData({
        dataset_id: "",
        schedule_name: "",
        forecast_days: 30,
        interval_type: "daily",
        model_type: "best",
      });

      fetchSchedules();
    } catch (error) {
      console.error(error);
      alert("Failed to create schedule");
    }
  };

  const runSchedule = async (scheduleId) => {
    try {
      await axios.post(
        `${API_URL}/forecast-schedules/run/${scheduleId}`,
        {},
        { headers }
      );

      fetchSchedules();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm("Delete schedule?")) return;

    try {
      await axios.delete(
        `${API_URL}/forecast-schedules/${scheduleId}`,
        { headers }
      );

      fetchSchedules();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">
          Forecast Scheduling Center
        </h1>

        <p className="mt-2 text-blue-100">
          Automate forecasting jobs and schedule recurring demand predictions.
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="bg-white/20 rounded-xl px-4 py-2">
            Project ID: {projectId}
          </div>

          <div className="bg-white/20 rounded-xl px-4 py-2">
            Total Schedules: {schedules.length}
          </div>
        </div>
      </div>

      {/* Create Schedule */}

      <div className="bg-white rounded-3xl p-6 shadow border">
        <h2 className="text-xl font-bold mb-5">
          Create Forecast Schedule
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          <input
            type="number"
            placeholder="Dataset ID"
            value={formData.dataset_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                dataset_id: Number(e.target.value),
              })
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Schedule Name"
            value={formData.schedule_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                schedule_name: e.target.value,
              })
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Forecast Days"
            value={formData.forecast_days}
            onChange={(e) =>
              setFormData({
                ...formData,
                forecast_days: Number(e.target.value),
              })
            }
            className="border rounded-xl px-4 py-3"
          />

          <select
            value={formData.interval_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                interval_type: e.target.value,
              })
            }
            className="border rounded-xl px-4 py-3"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button
            onClick={createSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create
          </button>
        </div>
      </div>

      {/* Schedule List */}

      <div className="bg-white rounded-3xl p-6 shadow border">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            Scheduled Forecasts
          </h2>

          <button
            onClick={fetchSchedules}
            className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No schedules available
          </div>
        ) : (
          <div className="grid gap-5">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border rounded-2xl p-5 hover:shadow-lg transition"
              >
                <div className="flex flex-col xl:flex-row xl:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      {schedule.schedule_name}
                    </h3>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        Dataset ID: {schedule.dataset_id}
                      </p>

                      <p>
                        Forecast Days: {schedule.forecast_days}
                      </p>

                      <p>
                        Interval: {schedule.interval_type}
                      </p>

                      <p>
                        Model: {schedule.model_type}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={15} />
                        Next Run
                      </div>

                      <div className="text-sm mt-1">
                        {schedule.next_run_at
                          ? new Date(
                              schedule.next_run_at
                            ).toLocaleString()
                          : "Not Scheduled"}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar size={15} />
                        Last Run
                      </div>

                      <div className="text-sm mt-1">
                        {schedule.last_run_at
                          ? new Date(
                              schedule.last_run_at
                            ).toLocaleString()
                          : "Never"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        runSchedule(schedule.id)
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <Play size={16} />
                      Run
                    </button>

                    <button
                      onClick={() =>
                        deleteSchedule(schedule.id)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastSchedulesPage;