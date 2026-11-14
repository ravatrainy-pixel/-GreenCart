
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("This password-reset link is missing its token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setMessage(
        response.data.message || "Your password has been reset successfully."
      );
      setCompleted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset your password. Please request a new link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-logo">🌿</div>

        <div className="login-header">
          <span className="login-tag">ACCOUNT RECOVERY</span>
          <h1>Reset Password</h1>
          <p>Choose a new password for your GreenCart account.</p>
        </div>

        {!completed && (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                maxLength={128}
                required
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {message && (
          <div className="login-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="login-message error" role="alert">
            {error}
          </div>
        )}

        {completed && (
          <button
            type="button"
            className="login-button"
            onClick={() => navigate("/login")}
          >
            Continue to Login
          </button>
        )}

        {!completed && (
          <p className="login-register">
            Remember your password? <Link to="/login">Login</Link>
          </p>
        )}

        <Link to="/" className="login-back">
          ← Back to GreenCart
        </Link>
      </div>
    </section>
  );
}

export default ResetPassword;
