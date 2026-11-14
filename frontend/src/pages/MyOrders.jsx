
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orderService";
import "../styles/MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOrders();

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
        date: order.date ?? order.createdAt ?? "",
        totalAmount: Number(
          order.totalAmount ?? order.total ?? order.amount ?? 0
        ),
        items: Array.isArray(order.items) ? order.items : [],
        orderStatus:
          order.orderStatus ?? order.status ?? "Confirmed",
      }));

      setOrders(normalizedOrders);

      
    } catch (err) {
      console.error("Error fetching orders:", err);

      setError(
        "Could not load orders. Check that Flask and MongoDB are running, then try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? String(dateValue)
      : date.toLocaleString("en-IN");
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getPaymentMethod = (method) => {
    const value = String(method || "").toLowerCase();

    if (value === "upi") return "UPI Payment";

    if (value === "cod" || value === "cash on delivery") {
      return "Cash on Delivery";
    }

    return method || "Not specified";
  };

  const getStatusClass = (status) =>
    String(status || "Confirmed")
      .toLowerCase()
      .replace(/\s+/g, "-");

  return (
    <section className="orders-page">
      <div className="orders-header">
        <span>🌿 GREENCART</span>
        <h1>My Orders</h1>
        <p>Track and view your previous GreenCart orders.</p>
      </div>

      {loading ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2>Loading Orders...</h2>
          <p>Please wait while we retrieve your orders.</p>
        </div>
      ) : error ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">⚠️</div>
          <h2>Unable to Load Orders</h2>
          <p>{error}</p>

          <button
            type="button"
            className="orders-shop-button"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>

          <Link to="/shop" className="orders-shop-button">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order, index) => {
              const orderId = order.id;
              const status = order.orderStatus;

              return (
                <div
                  className="order-card"
                  key={orderId || index}
                >
                  <div className="order-card-header">
                    <div>
                      <span className="order-label">
                        ORDER ID
                      </span>

                      <Link
                        to={`/order-details/${encodeURIComponent(
                          orderId
                        )}`}
                        className="order-id-link"
                      >
                        {orderId || "Unavailable"}
                      </Link>
                    </div>

                    <span
                      className={`order-status status-${getStatusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="order-date">
                    Ordered on {formatDate(order.date)}
                  </div>

                  <div className="ordered-products">
                    {order.items.length === 0 ? (
                      <p>
                        Product details are unavailable for this order.
                      </p>
                    ) : (
                      order.items.map((item, itemIndex) => {
                        const price = Number(item.price) || 0;
                        const quantity =
                          Number(item.quantity) || 1;

                        return (
                          <div
                            className="ordered-product"
                            key={
                              item.id ||
                              item._id ||
                              itemIndex
                            }
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={
                                  item.name ||
                                  item.title ||
                                  "Product"
                                }
                              />
                            ) : (
                              <div
                                className="ordered-product-image-placeholder"
                                aria-label="Product image unavailable"
                              >
                                🌿
                              </div>
                            )}

                            <div className="ordered-product-info">
                              <strong>
                                {item.name ||
                                  item.title ||
                                  "Product"}
                              </strong>

                              <span>Qty: {quantity}</span>

                              <span>
                                {formatCurrency(price)} each
                              </span>
                            </div>

                            <strong>
                              {formatCurrency(price * quantity)}
                            </strong>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-payment">
                      <span>Payment</span>
                      <strong>
                        {getPaymentMethod(
                          order.paymentMethod
                        )}
                      </strong>
                    </div>

                    <div className="order-payment">
                      <span>Payment Status</span>
                      <strong>
                        {order.paymentStatus || "Pending"}
                      </strong>
                    </div>

                    <div className="order-total">
                      <span>Total</span>
                      <strong>
                        {formatCurrency(order.totalAmount)}
                      </strong>
                    </div>
                  </div>

                  <Link
                    to={`/order-details/${encodeURIComponent(
                      orderId
                    )}`}
                    className="orders-shop-button"
                  >
                    View Order Details
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="orders-refresh">
            <button
              type="button"
              className="orders-shop-button"
              onClick={fetchOrders}
              disabled={loading}
            >
              Refresh Orders
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default MyOrders;
