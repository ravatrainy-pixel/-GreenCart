
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../api/orderService";
import "../styles/OrderDetails.css";

const API_URL = "http://127.0.0.1:5000/api";

const TRACKING_STAGES = [
  "Order Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const STATUS_MAP = {
  pending: 0,
  placed: 0,
  "order placed": 0,
  confirmed: 1,
  shipped: 2,
  "out for delivery": 3,
  delivered: 4,
};

function OrderTracking({ order }) {
  const currentStatus = String(order.orderStatus || "Confirmed")
    .toLowerCase()
    .trim();

  const currentStage = STATUS_MAP[currentStatus] ?? 1;

  return (
    <div className="tracking-section">
      <h2>Track Your Order</h2>

      <div className="tracking-timeline">
        {TRACKING_STAGES.map((stage, index) => {
          const completed = index <= currentStage;
          const active = index === currentStage;

          return (
            <div
              className={`tracking-step ${
                completed ? "completed" : ""
              } ${active ? "active" : ""}`}
              key={stage}
            >
              <div className="tracking-marker">
                {index < currentStage ? "✓" : index + 1}
              </div>

              <div className="tracking-step-content">
                <strong>{stage}</strong>

                <span>
                  {index < currentStage
                    ? "Completed"
                    : active
                    ? "Current status"
                    : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="tracking-current-status">
        Current Status:{" "}
        <strong>{order.orderStatus || "Confirmed"}</strong>
      </p>
    </div>
  );
}

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

      const result = await getOrderById(id);

if (!result.success || !result.order) {
  throw new Error(
    result.message || "Unable to find this order."
  );
}

setOrder(result.order);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Error fetching order:", err);
        setError(
          "Unable to load this order. Please check that the backend is running and try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setError("No order ID was provided.");
      setLoading(false);
    }

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <section className="orders-page">
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2>Loading Order Details...</h2>
          <p>Please wait while we retrieve your order.</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="orders-page">
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2>Order Not Found</h2>
          <p>{error || "We couldn't find this order."}</p>

          <Link to="/my-orders" className="orders-shop-button">
            Back to My Orders
          </Link>
        </div>
      </section>
    );
  }

  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <section className="orders-page">
      {/* Page Header */}
      <div className="orders-header">
        <span>🌿 GREENCART</span>
        <h1>Order Details</h1>
        <p>View your order information and track its delivery.</p>
      </div>

      {/* Main Order Card */}
      <div className="order-card">
        {/* Order ID and Status */}
        <div className="order-card-header">
          <div>
            <span className="order-label">ORDER ID</span>
            <div className="order-id-link">{order.id || id}</div>
          </div>

          <span className="order-status">
            {order.orderStatus || "Confirmed"}
          </span>
        </div>

        <div className="order-date">
          Ordered on {order.date || order.createdAt || "Date unavailable"}
        </div>

        {/* Order Tracking */}
        <OrderTracking order={order} />

        {/* Delivery Details */}
        <h2>Delivery Details</h2>

        <div className="order-delivery-details">
          <div className="order-payment">
            <span>Customer Name</span>
            <strong>{customer.fullName || "Not provided"}</strong>
          </div>

          <div className="order-payment">
            <span>Email Address</span>
            <strong>{customer.email || "Not provided"}</strong>
          </div>

          <div className="order-payment">
            <span>Phone Number</span>
            <strong>{customer.phone || "Not provided"}</strong>
          </div>

          <div className="order-payment">
            <span>Delivery Address</span>
            <strong>
              {[
                customer.address,
                customer.city,
                customer.state,
                customer.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "Not provided"}
            </strong>
          </div>
        </div>

        {/* Ordered Products */}
        <h2>Ordered Products</h2>

        {items.length === 0 ? (
          <p>No product details are available for this order.</p>
        ) : (
          <div className="ordered-products">
            {items.map((item, index) => {
              const price = Number(item.price) || 0;
              const quantity = Number(item.quantity) || 0;

              return (
                <div
                  className="ordered-product"
                  key={item.id || item._id || index}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name || "Product"} />
                  ) : (
                    <div
                      className="ordered-product-image-placeholder"
                      aria-label="Product image unavailable"
                    >
                      🌿
                    </div>
                  )}

                  <div className="ordered-product-info">
                    <strong>{item.name || "Product"}</strong>
                    <span>Quantity: {quantity}</span>
                    <span>₹{price.toFixed(2)} each</span>
                  </div>

                  <strong>₹{(price * quantity).toFixed(2)}</strong>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment and Total */}
        <h2>Payment Summary</h2>

        <div className="order-card-footer">
          <div className="order-payment">
            <span>Payment Method</span>
            <strong>
              {String(order.paymentMethod).toLowerCase() === "upi"
                ? "UPI Payment"
                : "Cash on Delivery"}
            </strong>
          </div>

          <div className="order-payment">
            <span>Payment Status</span>
            <strong>{order.paymentStatus || "Pending"}</strong>
          </div>

          <div className="order-total">
            <span>Total Amount</span>
            <strong>
              ₹{(Number(order.totalAmount) || 0).toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Navigation */}
        <Link to="/my-orders" className="orders-shop-button">
          Back to My Orders
        </Link>
      </div>
    </section>
  );
}

export default OrderDetails;