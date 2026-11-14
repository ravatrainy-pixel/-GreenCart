import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/AdminSidebar.css";

function AdminSidebar() {
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAdminAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin");
  };

  return (
    <aside className="admin-sidebar">

      <div className="admin-sidebar-logo">
        <div className="admin-logo-icon">🌿</div>

        <div>
          <h2>GreenCart</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <div className="admin-profile">
        <div className="admin-avatar">
          A
        </div>

        <div>
          <strong>Administrator</strong>
          <small>{admin?.email}</small>
        </div>
      </div>

      <nav className="admin-sidebar-menu">

        <NavLink to="/admin/dashboard" end>
          📊 Dashboard
        </NavLink>

        <NavLink to="/admin/products">
          📦 Products
        </NavLink>

        <NavLink to="/admin/orders">
          🛒 Orders
        </NavLink>

        <NavLink to="/admin/users">
          👥 Users
        </NavLink>

        <NavLink to="/admin/categories">
          🏷️ Categories
        </NavLink>

        <NavLink to="/admin/ai">
          🤖 AI Recommendations
        </NavLink>

        <NavLink to="/admin/ratings">
          ⭐ Ratings & Feedback
        </NavLink>
      </nav>

      <div className="admin-sidebar-bottom">

        <NavLink to="/">
          🏠 View Store
        </NavLink>

        <button onClick={handleLogout}>
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}

export default AdminSidebar;