
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(
        response.data.message ||
          "If an account exists with this email, you will receive a reset link."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
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
          <h1>Forgot Password?</h1>
          <p>
            Enter your registered email address and we'll send you a
            password reset link.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

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

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="login-register">
          Remember your password? <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="login-back">
          ← Back to GreenCart
        </Link>
      </div>
    </section>
  );
}

export default ForgotPassword;
