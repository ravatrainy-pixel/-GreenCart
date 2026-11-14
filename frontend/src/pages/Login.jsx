
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate empty fields
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // Authenticate with the Flask backend
      const result = await login(email.trim(), password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      // Login successful
      navigate("/account");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-container">
        {/* LOGO */}
        <div className="login-logo">🌿</div>

        {/* HEADER */}
        <div className="login-header">
          <span className="login-tag">WELCOME BACK</span>

          <h1>Welcome to GreenCart</h1>

          <p>
            Login to continue your sustainable shopping journey.
          </p>
        </div>

        {/* FORM */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="login-form-group">
            <label htmlFor="login-email">Email Address</label>

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="login-form-group">
            <label htmlFor="login-password">Password</label>

            <div className="login-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="login-message error" role="alert">
              {error}
            </div>
          )}

          {/* OPTIONS */}
          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" />
              Remember me
            </label>

            <Link to="/forgot-password" className="login-forgot">
              Forgot password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* REGISTER */}
        <p className="login-register">
          Don't have an account?{" "}
          <Link to="/register">Create Account</Link>
        </p>

        {/* BACK */}
        <Link to="/" className="login-back">
          ← Back to GreenCart
        </Link>
      </div>
    </section>
  );
}

export default Login;
