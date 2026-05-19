import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const token =
        response.data.access_token ||
        response.data.token ||
        response.data?.data?.access_token;

      const user =
        response.data.user ||
        response.data?.data?.user ||
        {
          id: response.data.id || null,
          name: response.data.name || email.split("@")[0],
          email: response.data.email || email,
          role: response.data.role || "user",
        };

      if (!token) {
        setError("Login failed: token not received from backend.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      window.location.href = "/dashboard";
    } catch (err) {
      console.log("LOGIN ERROR:", err.response || err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Login failed. Please check email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-center text-4xl shadow-2xl mb-4">
            📈
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            AI Demand Forecasting
          </h1>

          <p className="text-gray-500 mt-2">
            Login to continue
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="mb-5 bg-red-100 text-red-700 px-4 py-3 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                Show Password
              </label>

              <Link
                to="/reset-password"
                className="text-blue-600 font-semibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;