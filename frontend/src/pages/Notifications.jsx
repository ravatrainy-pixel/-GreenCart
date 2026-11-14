
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import "../styles/Notifications.css";

function getTimeLabel(createdAt) {
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type) {
  const icons = {
    order: "📦",
    delivery: "🚚",
    payment: "💳",
    stock: "🌿",
    wishlist: "❤️",
    account: "👤",
    expiry: "⚠️",
    ai: "✨",
    general: "🔔",
  };

  return icons[type] || "🔔";
}

function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  return (
    <section className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="notifications-header-content">
            <span className="notifications-tag">GREENCART UPDATES</span>
            <h1>Notifications</h1>
            <p>
              Stay updated on your orders, deliveries and shopping activities.
            </p>
          </div>

          <div className="notification-count-box">
            <span className="notification-count-number">
              {unreadCount}
            </span>
            <span className="notification-count-label">Unread</span>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="notification-actions">
            <button
              type="button"
              className="mark-all-button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              ✓ Mark all as read
            </button>

            <button
              type="button"
              className="clear-all-button"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        )}

        {notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${
                  notification.unread ? "notification-unread" : ""
                }`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {notification.unread && (
                      <span className="unread-dot" title="Unread" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <span className="notification-time">
                    {getTimeLabel(notification.createdAt)}
                  </span>

                  {notification.link && (
                    <Link
                      to={notification.link}
                      className="notification-view-link"
                      onClick={() => markAsRead(notification.id)}
                    >
                      View details →
                    </Link>
                  )}
                </div>

                <div className="notification-card-actions">
                  {notification.unread && (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-delete-button"
                    onClick={() => removeNotification(notification.id)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <h2>You're all caught up!</h2>
            <p>
              Your new order updates and shopping notifications will appear here.
            </p>
            <Link to="/shop" className="notification-shop-link">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default Notifications;
