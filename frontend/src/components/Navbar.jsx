import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../api/axios";

function Navbar() {
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";
  const isAdmin = user?.role === "admin";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.log(error.response);
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
      console.log(error.response);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/mark-all/read");

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.log(error.response);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Upload", path: "/upload", icon: "📁" },
    { name: "Forecast", path: "/forecast", icon: "📈" },
    { name: "Reports", path: "/reports", icon: "📄" },
  ];

  if (isAdmin) {
    navLinks.push({
      name: "Admin Panel",
      path: "/admin",
      icon: "🛡️",
    });
  }

  const isActive = (path) => location.pathname === path;

  const SidebarLink = ({ link }) => (
    <Link
      to={link.path}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${
        isActive(link.path)
          ? "bg-white text-blue-700 shadow-lg"
          : "text-blue-100 hover:bg-white/15 hover:text-white"
      }`}
    >
      <span className="text-lg">{link.icon}</span>
      <span>{link.name}</span>
    </Link>
  );

  return (
    <>
      <div className="lg:hidden sticky top-0 z-50 bg-white shadow px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-blue-600 text-white w-11 h-11 rounded-xl text-2xl"
        >
          ☰
        </button>

        <h1 className="font-extrabold text-gray-800">
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

      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white z-50 shadow-2xl flex-col">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-blue-700 rounded-2xl flex items-center justify-center text-2xl shadow">
              ⚡
            </div>

            <div>
              <h1 className="text-xl font-extrabold">
                AI Forecast
              </h1>
              <p className="text-xs text-blue-100">
                Demand Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {navLinks.map((link) => (
            <SidebarLink key={link.path} link={link} />
          ))}
        </div>

        <div className="p-4 border-t border-white/20">

          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl font-bold"
          >
            Logout
          </button>
        </div>
      </aside>

      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 bg-white shadow-sm z-40 items-center justify-between px-6">        <div>
          <h2 className="text-lg font-bold text-gray-800">
            AI Demand Forecasting
            </h2>
            <p className="text-xs text-gray-500">
              Welcome back, {userName}
              </p>
        </div>

        <div className="flex items-center gap-5 relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 bg-gray-100 rounded-lg text-lg hover:bg-blue-50"
            >

            🔔

            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-2xl transition">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow">
              {userName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {userName}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide $
                  {user.role === "admin"
                   ? "bg-purple-100 text-purple-700"
                   : "bg-green-100 text-green-700"
                   }`}
                   >
                     {user.role || "user"}
                     </span>
                     </div>
                    </div>
                  </div>
      </header>

      {showNotifications && (
        <div className="fixed right-5 top-24 w-[92%] sm:w-96 bg-white rounded-2xl shadow-2xl border z-[70] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800">
              Notifications
            </h2>

            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 font-bold"
              >
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    !item.is_read && markAsRead(item.id)
                  }
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !item.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <h3 className="font-bold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
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
        ></div>
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-blue-600 to-indigo-700 z-[70] text-white shadow-2xl transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/20 flex justify-between items-center">
          <h1 className="text-xl font-extrabold">
            AI Forecast
          </h1>

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {navLinks.map((link) => (
            <SidebarLink key={link.path} link={link} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <button
            onClick={logout}
            className="w-full bg-red-500 py-3 rounded-xl font-bold"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;