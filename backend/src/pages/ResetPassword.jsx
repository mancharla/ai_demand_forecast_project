// Complete ResetPassword.jsx file

import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Token is expected in URL like:
  // /reset-password?token=your_reset_token
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const validatePassword = (password) => {
    // Minimum 8 chars, at least one uppercase, lowercase, number, special char
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (!formData.new_password || !formData.confirm_password) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(formData.new_password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/reset-password", {
        token,
        new_password: formData.new_password,
      });

      setSuccess("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Password reset failed. The token may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-center text-4xl shadow-2xl mb-4">
            🔐
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            Reset Password
          </h1>

          <p className="text-gray-500 mt-2">
            Enter your new secure password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!token && (
            <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-xl font-medium">
              Invalid reset link. Token is missing.
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 text-green-700 px-4 py-3 rounded-xl font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            {/* Show Password */}
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="rounded"
              />
              Show Password
            </label>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-2">
                Password must contain:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Minimum 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !token}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                loading || !token
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] hover:shadow-2xl"
              }`}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
