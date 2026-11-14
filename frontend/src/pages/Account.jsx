import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import "../styles/Account.css";

function Account() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [message, setMessage] = useState("");

  // ==============================
  // UPDATE PROFILE
  // ==============================

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    updateUser({
      name: name.trim(),
      email: email.trim(),
    });

    setMessage("Profile updated successfully.");
    setIsEditing(false);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==============================
  // NOT LOGGED IN
  // ==============================

  if (!user) {
    return (
      <section className="account-page">
        <div className="account-container account-login-required">

          <div className="account-avatar">
            👤
          </div>

          <h1>
            Login Required
          </h1>

          <p>
            Please login to view your GreenCart account.
          </p>

          <Link
            to="/login"
            className="account-primary-button"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="account-secondary-button"
          >
            Create Account
          </Link>

        </div>
      </section>
    );
  }

  return (
    <section className="account-page">

      <div className="account-container">

        {/* =========================================
            PROFILE HEADER
        ========================================= */}

        <div className="account-header">

          <div className="account-avatar">
            👤
          </div>

          <div className="account-user-info">

            <span className="account-tag">
              GREENCART ACCOUNT
            </span>

            <h1>
              Hello, {user.name}
            </h1>

            <p>
              {user.email}
            </p>

          </div>

        </div>


        {/* =========================================
            PROFILE
        ========================================= */}

        <div className="account-profile">

          <div className="account-profile-header">

            <div>
              <span className="account-section-tag">
                YOUR PROFILE
              </span>

              <h2>
                Personal Information
              </h2>
            </div>

            <button
              type="button"
              className="account-edit-button"
              onClick={() => {
                setIsEditing(!isEditing);
                setMessage("");
              }}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>

          </div>


          <div className="account-profile-grid">

            <div className="account-profile-field">

              <label>
                Full Name
              </label>

              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              ) : (
                <div className="account-profile-value">
                  {user.name}
                </div>
              )}

            </div>


            <div className="account-profile-field">

              <label>
                Email Address
              </label>

              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              ) : (
                <div className="account-profile-value">
                  {user.email}
                </div>
              )}

            </div>

          </div>


          {isEditing && (
            <button
              type="button"
              className="account-save-button"
              onClick={handleSave}
            >
              Save Changes
            </button>
          )}


          {message && (
            <div className="account-message">
              {message}
            </div>
          )}

        </div>


        {/* =========================================
            ACCOUNT OPTIONS
        ========================================= */}

        <div className="account-grid">

          <Link
            to="/my-orders"
            className="account-card"
          >

            <div className="account-card-icon">
              📦
            </div>

            <div>
              <h3>
                My Orders
              </h3>

              <p>
                View and track your orders.
              </p>
            </div>

          </Link>


          <Link
            to="/wishlist"
            className="account-card"
          >

            <div className="account-card-icon">
              ❤️
            </div>

            <div>
              <h3>
                Wishlist
              </h3>

              <p>
                View your saved products.
              </p>
            </div>

          </Link>


          <Link
            to="/cart"
            className="account-card"
          >

            <div className="account-card-icon">
              🛒
            </div>

            <div>
              <h3>
                Shopping Cart
              </h3>

              <p>
                Review products before checkout.
              </p>
            </div>

          </Link>


          <Link
            to="/ai-recommendation"
            className="account-card"
          >

            <div className="account-card-icon">
              🤖
            </div>

            <div>
              <h3>
                AI Recommendations
              </h3>

              <p>
                Get personalized product recommendations.
              </p>
            </div>

          </Link>


          <Link
            to="/notifications"
            className="account-card"
          >

            <div className="account-card-icon">
              🔔
            </div>

            <div>
              <h3>
                Notifications
              </h3>

              <p>
                View product and order reminders.
              </p>
            </div>

          </Link>

        </div>


        {/* =========================================
            SMART REMINDERS
        ========================================= */}

        <div className="account-future">

          <span>
            🌿 GREENCART SMART FEATURES
          </span>

          <h2>
            Smart Product Reminders
          </h2>

          <p>
            GreenCart will track your purchased products
            and notify you when a product may be running
            out or approaching its expiry date.
          </p>

        </div>


        {/* =========================================
            LOGOUT
        ========================================= */}

        <div className="account-logout-section">

          <button
            type="button"
            className="account-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </section>
  );
}

export default Account;