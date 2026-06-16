import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../api/axios";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";

  const isAdmin =
    user?.role === "super_admin" ||
    user?.role === "admin";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications");
      setNotifications(response.data || []);
    } catch (error) {
      console.log(error.response || error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.log(error.response || error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/mark-all-read");

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setShowNotifications(false);
    } catch (error) {
      console.log(error.response || error);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const navGroups = [
    {
      title: "Enterprise",
      links: [
        { name: "Enterprise Dashboard", path: "/enterprise-dashboard", icon: "🏛️" },
        { name: "Organizations", path: "/organizations", icon: "🏢" },
        { name: "Executive Command Center", path: "/executive-command-center", icon: "👔" },
        { name: "Project Overview", path: "/project-overview", icon: "📁" },
      ],
    },
    {
      title: "Core",
      links: [
        { name: "Dashboard", path: "/dashboard", icon: "📊" },
        { name: "Upload", path: "/upload", icon: "📁" },
        { name: "Forecast", path: "/forecast", icon: "📈" },
        { name: "Reports", path: "/reports", icon: "📄" },
        { name: "Workspaces", path: "/projects", icon: "🗂️" },
      ],
    },
    {
      title: "Governance",
      links: [
        { name: "Forecast Approvals", path: "/forecast-approvals", icon: "✅" },
        { name: "Forecast Governance", path: "/forecast-governance", icon: "🛡️" },
        { name: "Workflow Automation", path: "/workflow-automation", icon: "⚙️" },
        { name: "Audit Logs", path: "/audit-logs", icon: "📜" },
      ],
    },
    {
      title: "Planning & Intelligence",
      links: [
        { name: "Strategic Planning", path: "/strategic-planning", icon: "🎯" },
        { name: "KPI Management", path: "/kpi-management", icon: "📌" },
        { name: "Data Quality", path: "/data-quality", icon: "🧹" },
        { name: "Executive Dashboard", path: "/executive-dashboard", icon: "📋" },
        { name: "AI Recommendations", path: "/ai-recommendations", icon: "🤖" },
        { name: "KPI Trends", path: "/kpi-trends", icon: "📈" },
        { name: "KPI Reports", path: "/kpi-reports", icon: "📊" },
      ],
    },
    {
      title: "Communication",
      links: [
        { name: "Notification Center", path: "/notification-center", icon: "🔔" },
        { name: "Report Sharing", path: "/report-sharing", icon: "📤" },
        { name: "Data Quality Reports", path: "/data-quality-reports", icon: "📑" },
      ],
    },
  ];

  if (isAdmin) {
    navGroups.push({
      title: "Admin",
      links: [
        { name: "Admin Panel", path: "/admin", icon: "🛡️" },
      ],
    });
  }

  const isActive = (path) => location.pathname === path;

  const SidebarLink = ({ link }) => (
    <Link
      to={link.path}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
        isActive(link.path)
          ? "bg-white text-blue-700 shadow-lg dark:bg-white/10 dark:text-blue-100"
          : "text-blue-100 dark:text-blue-200 hover:bg-white/15 hover:text-white"
      }`}
    >
      <span className="text-lg">{link.icon}</span>
      <span>{link.name}</span>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-blue-200/80">
            {group.title}
          </p>

          <div className="space-y-1">
            {group.links.map((link) => (
              <SidebarLink key={link.path} link={link} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="lg:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 shadow px-4 py-4 flex items-center justify-between transition-colors duration-300">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-blue-600 text-white w-11 h-11 rounded-xl text-2xl"
        >
          ☰
        </button>

        <h1 className="font-extrabold text-gray-800 dark:text-white">
          AI Demand Forecasting
        </h1>

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative text-2xl"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-blue-600 to-indigo-700 dark:from-slate-900 dark:to-slate-950 text-white z-50 shadow-2xl flex-col transition-colors duration-300">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-blue-700 rounded-2xl flex items-center justify-center text-2xl shadow dark:bg-slate-800 dark:text-blue-300">
              ⚡
            </div>

            <div>
              <h1 className="text-xl font-extrabold">AI Forecast</h1>
              <p className="text-xs text-blue-100">Enterprise Platform</p>
            </div>
          </div>
        </div>

        <SidebarContent />

        <div className="p-4 border-t border-white/20 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 py-3 rounded-2xl font-semibold transition-colors duration-300"
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            <span>{darkMode ? "Switch to Light" : "Switch to Dark"}</span>
          </button>

          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 py-3 rounded-xl font-bold transition-colors duration-300"
          >
            Logout
          </button>
        </div>
      </aside>

      <header className="hidden lg:flex fixed top-0 left-72 right-0 h-14 bg-white dark:bg-slate-900 shadow-sm z-40 items-center justify-between px-6 transition-colors duration-300">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            AI Demand Forecasting
          </h2>
          <p className="text-xs text-gray-500">Welcome back, {userName}</p>
        </div>

        <div className="flex items-center gap-5 relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-lg text-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-300"
          >
            🔔

            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-2xl transition-colors duration-300">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {userName}
              </p>

              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200"
                }`}
              >
                {user.role || "Viewer"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="fixed right-5 top-24 w-[92%] sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-700 z-[70] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800">
            <h2 className="font-bold text-gray-800 dark:text-white">
              Notifications
            </h2>

            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-300 font-bold"
              >
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-300">
                No notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.is_read && markAsRead(item.id)}
                  className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                    !item.is_read ? "bg-blue-50 dark:bg-slate-800" : ""
                  }`}
                >
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    {item.title || "Notification"}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.message}
                  </p>

                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                    {item.created_at}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-[60]"
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-blue-600 to-indigo-700 dark:from-slate-900 dark:to-slate-950 z-[70] text-white shadow-2xl transform transition-transform flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/20 flex justify-between items-center">
          <h1 className="text-xl font-extrabold">AI Forecast</h1>

          <button onClick={() => setSidebarOpen(false)} className="text-2xl">
            ✕
          </button>
        </div>

        <SidebarContent />

        <div className="p-5 border-t border-white/20 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 py-3 rounded-2xl font-semibold transition-colors duration-300"
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            <span>{darkMode ? "Switch to Light" : "Switch to Dark"}</span>
          </button>

          <button
            onClick={logout}
            className="w-full bg-red-500 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors duration-300"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;