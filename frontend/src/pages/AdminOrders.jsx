
import { useEffect, useState } from "react";
import {
  getAdminOrders,
  updateOrderStatus as updateOrderStatusAPI,
} from "../api/orderService";
import "../styles/AdminOrders.css";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
function getOrderId(order) {
  return String(order.id ?? order.orderId ?? order._id ?? "");
}

function getCustomerName(order) {
  return (
    order.customer?.fullName ||
    order.customer?.name ||
    order.customerName ||
    order.user?.name ||
    "Customer"
  );
}

function getCustomerEmail(order) {
  return (
    order.customer?.email ||
    order.customerEmail ||
    order.user?.email ||
    "Not provided"
  );
}

function getOrderTotal(order) {
  return Number(
    order.totalAmount ?? order.total ?? order.amount ?? 0
  );
}

function getOrderDate(order) {
  const date = order.createdAt || order.date;

  if (!date) return "Not available";

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? String(date)
    : parsedDate.toLocaleDateString("en-IN");
}

function getStatus(order) {
  return order.orderStatus || order.status || "Confirmed";
}

function getShippingAddress(order) {
  const customer = order.customer || {};

  if (typeof order.shippingAddress === "string") {
    return order.shippingAddress;
  }

  if (
    order.shippingAddress &&
    typeof order.shippingAddress === "object"
  ) {
    return Object.values(order.shippingAddress)
      .filter(Boolean)
      .join(", ");
  }

  return [
    customer.address,
    customer.city,
    customer.state,
    customer.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Not provided";
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch orders from Flask and MongoDB.
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminOrders();

      if (!result.success) {
        throw new Error(
          result.message || "Unable to load orders."
        );
      }

      const databaseOrders = Array.isArray(result.orders)
        ? result.orders
        : [];

      const normalizedOrders = databaseOrders.map((order) => ({
        ...order,
        id: String(
          order.id ?? order.orderId ?? order._id ?? ""
        ),
        orderStatus:
          order.orderStatus ?? order.status ?? "Confirmed",
        totalAmount: Number(
          order.totalAmount ?? order.total ?? order.amount ?? 0
        ),
        items: Array.isArray(order.items) ? order.items : [],
      }));

      setOrders(normalizedOrders);

      setSelectedOrder((current) => {
        if (!current) return null;

        return (
          normalizedOrders.find(
            (order) =>
              getOrderId(order) === getOrderId(current)
          ) || null
        );
      });
    } catch (err) {
      console.error("Unable to fetch orders:", err);

      setError(
        "Could not load orders. Make sure Flask and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status in MongoDB.
  const updateOrderStatus = async (orderId, newStatus) => {
    const previousOrder = orders.find(
      (order) => getOrderId(order) === String(orderId)
    );

    if (
      !previousOrder ||
      getStatus(previousOrder) === newStatus
    ) {
      return;
    }

    try {
      setUpdatingId(String(orderId));

      const result = await updateOrderStatusAPI(
        orderId,
        newStatus
      );

      if (!result.success) {
        throw new Error(
          result.message || "Status update failed."
        );
      }

      const updatedOrder = {
        ...previousOrder,
        ...(result.order || {}),
        orderStatus:
          result.order?.orderStatus ||
          result.orderStatus ||
          newStatus,
      };

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          getOrderId(order) === String(orderId)
            ? updatedOrder
            : order
        )
      );

      setSelectedOrder((current) =>
        current &&
        getOrderId(current) === String(orderId)
          ? updatedOrder
          : current
      );
    } catch (err) {
      console.error("Unable to update order:", err);

      alert(
        err.message ||
          "Unable to update order status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Search and filter orders.
  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();

    const matchesSearch =
      getOrderId(order).toLowerCase().includes(query) ||
      getCustomerName(order).toLowerCase().includes(query) ||
      getCustomerEmail(order).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      getStatus(order) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Dashboard statistics.
  const pendingOrders = orders.filter(
    (order) =>
      getStatus(order) === "Confirmed" ||
      getStatus(order) === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => getStatus(order) === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => getStatus(order) === "Delivered")
    .reduce(
      (total, order) => total + getOrderTotal(order),
      0
    );

  return (
    <div className="admin-orders">
      <div className="admin-orders-header">
        <div>
          <h1>Orders</h1>
          <p>View and manage customer orders.</p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh Orders"}
        </button>
      </div>

      {/* Statistics */}
      <div className="order-statistics">
        <div className="order-stat-card">
          <span>🛒</span>
          <p>Total Orders</p>
          <strong>{orders.length}</strong>
        </div>

        <div className="order-stat-card">
          <span>⏳</span>
          <p>Pending / Confirmed</p>
          <strong>{pendingOrders}</strong>
        </div>

        <div className="order-stat-card">
          <span>✅</span>
          <p>Delivered Orders</p>
          <strong>{deliveredOrders}</strong>
        </div>

        <div className="order-stat-card">
          <span>💰</span>
          <p>Delivered Order Value</p>
          <strong>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      {/* Search and status filter */}
      <div className="orders-toolbar">
        <input
          type="search"
          placeholder="Search by order ID or customer..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search orders"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filter orders by status"
        >
          <option value="All">All Statuses</option>

          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Loading and error states */}
      {loading && orders.length === 0 && (
        <div className="orders-empty">
          <h3>Loading Orders...</h3>
          <p>Retrieving orders from MongoDB.</p>
        </div>
      )}

      {!loading && error && (
        <div className="orders-empty">
          <h3>Unable to Load Orders</h3>
          <p>{error}</p>

          <button type="button" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      )}

      {/* Orders table */}
      {!error && !(loading && orders.length === 0) && (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="orders-empty">
                      <div>🛍️</div>

                      <h3>
                        {orders.length === 0
                          ? "No orders yet"
                          : "No matching orders"}
                      </h3>

                      <p>
                        {orders.length === 0
                          ? "Customer orders will appear here after checkout."
                          : "Try another search or status filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = getOrderId(order);
                  const status = getStatus(order);

                  return (
                    <tr key={orderId}>
                      <td>
                        <strong>#{orderId || "N/A"}</strong>
                      </td>

                      <td>
                        <div className="order-customer">
                          <strong>
                            {getCustomerName(order)}
                          </strong>
                          <small>
                            {getCustomerEmail(order)}
                          </small>
                        </div>
                      </td>

                      <td>{getOrderDate(order)}</td>

                      <td>
                        ₹
                        {getOrderTotal(order).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        <span
                          className={`order-status status-${status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="order-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedOrder(order)
                            }
                          >
                            Details
                          </button>

                          <select
                            aria-label={`Update status for order ${orderId}`}
                            value={status}
                            disabled={
                              updatingId === orderId
                            }
                            onChange={(event) =>
                              updateOrderStatus(
                                orderId,
                                event.target.value
                              )
                            }
                          >
                            {ORDER_STATUSES.map((option) => (
                              <option
                                key={option}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>

                          {updatingId === orderId && (
                            <small>Saving...</small>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-modal-header">
              <div>
                <h2 id="order-modal-title">
                  Order Details
                </h2>
                <p>Order #{getOrderId(selectedOrder)}</p>
              </div>

              <button
                type="button"
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ✕
              </button>
            </div>

            <div className="order-detail-row">
              <span>Customer</span>
              <strong>
                {getCustomerName(selectedOrder)}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Email</span>
              <strong>
                {getCustomerEmail(selectedOrder)}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Phone</span>
              <strong>
                {selectedOrder.customer?.phone ||
                  "Not provided"}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Order Date</span>
              <strong>{getOrderDate(selectedOrder)}</strong>
            </div>

            <div className="order-detail-row">
              <span>Order Status</span>
              <strong>{getStatus(selectedOrder)}</strong>
            </div>

            <div className="order-detail-row">
              <span>Total Amount</span>
              <strong>
                ₹
                {getOrderTotal(
                  selectedOrder
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Payment Method</span>
              <strong>
                {String(
                  selectedOrder.paymentMethod ||
                    "Not specified"
                ).toLowerCase() === "cod"
                  ? "Cash on Delivery"
                  : selectedOrder.paymentMethod ||
                    "Not specified"}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Payment Status</span>
              <strong>
                {selectedOrder.paymentStatus ||
                  "Not specified"}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Shipping Address</span>
              <strong>
                {getShippingAddress(selectedOrder)}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Items</span>
              <strong>
                {selectedOrder.items.length > 0
                  ? selectedOrder.items
                      .map(
                        (item) =>
                          `${item.name || item.title || "Product"} × ${
                            item.quantity || 1
                          }`
                      )
                      .join(", ")
                  : "No item details available"}
              </strong>
            </div>

            <div className="order-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
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

export default AdminOrders;
