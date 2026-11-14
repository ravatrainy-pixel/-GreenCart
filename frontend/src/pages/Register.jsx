
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate required fields
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Your Flask backend requires at least 8 characters
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      // Send registration request to Flask and MongoDB
      const result = await register(
        name.trim(),
        email.trim().toLowerCase(),
        password
      );

      if (!result.success) {
        setError(result.message || "Unable to create your account.");
        return;
      }

       
      setSuccess(
        result.requiresEmailVerification
          ? "Account created! Please check your email and verify your account before logging in."
          : "Account created successfully! Redirecting to login..."
      );

      if (!result.requiresEmailVerification) {
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-icon">🌿</div>

          <span className="register-tag">
            GREENCART ACCOUNT
          </span>

          <h1>Create Account</h1>

          <p>
            Join GreenCart and start shopping sustainably.
          </p>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          {/* NAME */}
          <div className="register-field">
            <label htmlFor="register-name">Full Name</label>

            <input
              id="register-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          {/* EMAIL */}
          <div className="register-field">
            <label htmlFor="register-email">Email Address</label>

            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="register-field">
            <label htmlFor="register-password">Password</label>

            <input
              id="register-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="register-field">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>

            <input
              id="register-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="register-message error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div
              className="register-message success"
              role="status"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="register-login">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </section>
  );
}

export default Register;
