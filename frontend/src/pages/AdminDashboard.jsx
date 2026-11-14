
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const API_URL = "http://127.0.0.1:5000/api";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAdminHeaders = () => {
    const token = localStorage.getItem("greencartAdminToken");

    if (!token) {
      throw new Error("Admin session missing. Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAdminHeaders();

      const [productsResponse, ordersResponse, usersResponse] =
        await Promise.all([
          axios.get(`${API_URL}/products`),
          api.get("/admin/orders", { headers }),
          api.get("/admin/users", { headers }),
        ]);

      const fetchedProducts = productsResponse.data.products || [];
      const fetchedOrders = ordersResponse.data.orders || [];

      setProducts(
        fetchedProducts.map((product) => ({
          ...product,
          id: product.id ?? product._id,
        }))
      );

      setOrders(fetchedOrders);
      setTotalUsers(
        Number(usersResponse.data.count ?? usersResponse.data.users?.length ?? 0)
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);

      setError(
        err.response?.status === 401 || err.response?.status === 403
          ? "Your admin session may have expired. Please log in again."
          : err.message || "Unable to load dashboard data. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.status === "Active"
  ).length;

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock);
    return stock > 0 && stock <= 5;
  });

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) <= 0
  );

  const inventoryValue = products.reduce((total, product) => {
    return total + Number(product.price || 0) * Number(product.stock || 0);
  }, 0);

  const getOrderStatus = (order) =>
    order.status || order.orderStatus || "Pending";

  const pendingOrders = orders.filter(
    (order) => getOrderStatus(order) === "Pending"
  ).length;

  const quickActions = [
    {
      icon: "📦",
      title: "Add Product",
      description: "Add a new product to GreenCart",
      path: "/admin/products/add",
    },
    {
      icon: "🛒",
      title: "Manage Orders",
      description: "View and manage customer orders",
      path: "/admin/orders",
    },
    {
      icon: "👥",
      title: "Manage Users",
      description: "View and manage registered users",
      path: "/admin/users",
    },
    {
      icon: "🏷️",
      title: "Manage Categories",
      description: "Add, edit, and manage categories",
      path: "/admin/categories",
    },
    {
      icon: "🤖",
      title: "AI Recommendations",
      description: "Review product and inventory suggestions",
      path: "/admin/ai",
    },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-empty-state">
          <h3>Loading dashboard...</h3>
          <p>Fetching your latest store information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-empty-state">
          <span>⚠️</span>
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>

          <button
            className="dashboard-view-button"
            type="button"
            onClick={fetchDashboardData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome to your GreenCart administration panel.</p>
        </div>

        <button
          className="dashboard-add-button"
          onClick={() => navigate("/admin/products/add")}
        >
          + Add Product
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-icon">📦</div>
          <div>
            <p>Total Products</p>
            <h2>{totalProducts}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <p>Active Products</p>
            <h2>{activeProducts}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">🛒</div>
          <div>
            <p>Total Orders</p>
            <h2>{orders.length}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">⏳</div>
          <div>
            <p>Pending Orders</p>
            <h2>{pendingOrders}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <p>Total Customers</p>
            <h2>{totalUsers}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">⚠️</div>
          <div>
            <p>Low Stock Products</p>
            <h2>{lowStockProducts.length}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">❌</div>
          <div>
            <p>Out of Stock</p>
            <h2>{outOfStockProducts.length}</h2>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">💰</div>
          <div>
            <p>Inventory Value</p>
            <h2>
              ₹
              {inventoryValue.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </h2>
          </div>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Quickly access important admin features.</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <button
              type="button"
              className="quick-action-card"
              key={action.path}
              onClick={() => navigate(action.path)}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <span className="quick-action-link">Open Page →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Low Stock Products</h2>
            <p>Products that may need restocking soon.</p>
          </div>

          <button
            className="dashboard-view-button"
            onClick={() => navigate("/admin/products")}
          >
            View All Products →
          </button>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="dashboard-empty-state">
            <span>🎉</span>
            <h3>Everything looks good!</h3>
            <p>No products currently have low stock.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="dashboard-product-name">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || "Product"}
                          />
                        ) : (
                          <span className="dashboard-product-placeholder">
                            📦
                          </span>
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td>{product.category || "Uncategorized"}</td>

                    <td>
                      ₹
                      {Number(product.price || 0).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span className="dashboard-stock-warning">
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`dashboard-status ${
                          product.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {product.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {outOfStockProducts.length > 0 && (
        <div className="dashboard-stock-notice">
          <span>⚠️</span>
          <div>
            <h3>Restocking Required</h3>
            <p>
              {outOfStockProducts.length} product(s) are out of stock.
              Please review your inventory.
            </p>
          </div>

          <button onClick={() => navigate("/admin/products")}>
            Review Products
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
