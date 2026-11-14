
import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch registered customers from Flask and MongoDB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("greencartAdminToken");

        if (!token) {
          setError("Please log in as an administrator to view customers.");
          return;
        }

        const response = await api.get("/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUsers(
            (response.data.users || []).map((user) => ({
              ...user,
              status: user.status || "Active",
            }))
          );
        } else {
          setError("Unable to load customers.");
        }
      } catch (err) {
        console.error("Unable to fetch customers:", err);

        if (err.response?.status === 401) {
          setError("Your login session may have expired. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Admin access is required to view customers.");
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load customers. Check the backend connection."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getUserId = (user) => String(user.id ?? user._id ?? "");

  const getUserName = (user) =>
    user.name ||
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "Unnamed User";

  const getUserEmail = (user) => user.email || "No email provided";

  const getStatus = (user) => user.status || "Active";

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    const matchesSearch =
      getUserName(user).toLowerCase().includes(query) ||
      getUserEmail(user).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || getStatus(user) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status changes are currently temporary frontend changes.
  // Saving customer status permanently requires a backend API.
  
const updateUserStatus = async (userId, newStatus) => {
  const previousUsers = users;

  // Update the interface immediately
  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      getUserId(user) === String(userId)
        ? { ...user, status: newStatus }
        : user
    )
  );

  try {
    const token = localStorage.getItem("greencartAdminToken");

    await api.patch(
      `/admin/users/${userId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSelectedUser((current) =>
      current && getUserId(current) === String(userId)
        ? { ...current, status: newStatus }
        : current
    );
  } catch (err) {
    console.error("Unable to update customer status:", err);

    // Restore the previous interface if the API request fails
    setUsers(previousUsers);

    setSelectedUser((current) =>
      current
        ? previousUsers.find(
            (user) => getUserId(user) === getUserId(current)
          ) || null
        : null
    );

    alert(
      err.response?.data?.message ||
        "Unable to update customer status. Please try again."
    );
  }
};


  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <div>
          <h1>Customers</h1>
          <p>View registered customers and manage their status.</p>
        </div>
      </div>

      <div className="users-summary">
        <div className="users-summary-card">
          <span>👥</span>
          <p>Total Customers</p>
          <strong>{users.length}</strong>
        </div>

        <div className="users-summary-card">
          <span>✅</span>
          <p>Active Customers</p>
          <strong>
            {users.filter((user) => getStatus(user) === "Active").length}
          </strong>
        </div>

        <div className="users-summary-card">
          <span>🚫</span>
          <p>Inactive Customers</p>
          <strong>
            {users.filter((user) => getStatus(user) === "Inactive").length}
          </strong>
        </div>
      </div>

      <div className="users-toolbar">
        <input
          type="search"
          placeholder="Search by name or email..."
          aria-label="Search customers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          aria-label="Filter customers by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">
                  <div className="users-empty">
                    <h3>Loading customers...</h3>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5">
                  <div className="users-empty">
                    <h3>Unable to load customers</h3>
                    <p>{error}</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="users-empty">
                    <div>👤</div>
                    <h3>
                      {users.length === 0
                        ? "No customers found"
                        : "No matching customers"}
                    </h3>
                    <p>
                      {users.length === 0
                        ? "Registered customers will appear here."
                        : "Try a different search or status filter."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={getUserId(user)}>
                  <td>
                    <div className="user-name-cell">
                      <span className="user-avatar">
                        {getUserName(user).charAt(0).toUpperCase()}
                      </span>
                      <strong>{getUserName(user)}</strong>
                    </div>
                  </td>

                  <td>{getUserEmail(user)}</td>

                  <td>
                    {user.createdAt || user.joinedAt
                      ? (() => {
                          const date = new Date(
                            user.createdAt || user.joinedAt
                          );

                          return Number.isNaN(date.getTime())
                            ? "Not available"
                            : date.toLocaleDateString("en-IN");
                        })()
                      : "Not available"}
                  </td>

                  <td>
                    <span
                      className={
                        getStatus(user) === "Active"
                          ? "user-status-active"
                          : "user-status-inactive"
                      }
                    >
                      {getStatus(user)}
                    </span>
                  </td>

                  <td>
                    <div className="user-actions">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                      >
                        Details
                      </button>

                      <select
                        aria-label={`Change status for ${getUserName(user)}`}
                        value={getStatus(user)}
                        onChange={(e) =>
                          updateUserStatus(
                            getUserId(user),
                            e.target.value
                          )
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div
          className="user-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <section
            className="user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <div>
                <h2 id="user-modal-title">Customer Details</h2>
                <p>Customer ID: {getUserId(selectedUser) || "N/A"}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close customer details"
              >
                ✕
              </button>
            </div>

            <div className="user-detail-row">
              <span>Name</span>
              <strong>{getUserName(selectedUser)}</strong>
            </div>

            <div className="user-detail-row">
              <span>Email</span>
              <strong>{getUserEmail(selectedUser)}</strong>
            </div>

            <div className="user-detail-row">
              <span>Phone</span>
              <strong>{selectedUser.phone || "Not provided"}</strong>
            </div>

            <div className="user-detail-row">
              <span>Status</span>
              <strong>{getStatus(selectedUser)}</strong>
            </div>

            <div className="user-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
