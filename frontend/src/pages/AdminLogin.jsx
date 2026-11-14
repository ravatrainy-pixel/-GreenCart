import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const { loginAdmin } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    const result = await loginAdmin(email, password);

    if (result.success) {
  navigate("/admin/dashboard");
} else {
  setError(result.message || "Invalid email or password.");
}
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">

        {/* Logo */}
        <div className="admin-login-logo">
          🌿
        </div>

        {/* Heading */}
        <div className="admin-login-header">
          <span className="admin-login-tag">
            GREENCART ADMIN
          </span>

          <h1>Admin Login</h1>

          <p>
            Login to manage your GreenCart store.
          </p>
        </div>

        {/* Login Form */}
        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="admin-login-field">
            <label htmlFor="admin-email">
              Admin Email
            </label>

            <input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="admin-login-button"
          >
            Login to Admin Panel
          </button>
        </form>

        {/* Demo Credentials */}
        

        {/* Back to Website */}
        <Link
          to="/"
          className="admin-login-back"
        >
          ← Back to GreenCart
        </Link>

      </div>
    </div>
  );
}

export default AdminLogin;