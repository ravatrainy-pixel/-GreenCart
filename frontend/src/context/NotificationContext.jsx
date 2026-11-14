
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch notifications from MongoDB
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }

    try {
      const response = await api.get(
        "/notifications",
        authConfig
      );

      const fetchedNotifications = response.data.notifications || [];

      setNotifications(
        fetchedNotifications.map((notification) => ({
          ...notification,
          id: String(notification.id ?? notification._id),
        }))
      );
    } catch (error) {
      console.error("Could not fetch notifications:", error);
    }
  }, [token, user]);

  // Check expiry and repurchase reminders
  const checkReminders = useCallback(async () => {
    if (!token || !user) return;

    try {
      await api.post(
        "/notifications/check-reminders",
        {},
        authConfig
      );

      await fetchNotifications();
    } catch (error) {
      console.error("Could not check reminders:", error);
    }
  }, [token, user, fetchNotifications]);

  // Run reminder check when a customer logs in
  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      setLoading(true);

      try {
        await api.post(
          "/notifications/check-reminders",
          {},
          authConfig
        );

        if (!cancelled) {
          await fetchNotifications();
        }
      } catch (error) {
        console.error("Notification loading error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [token, user, fetchNotifications]);

  // Keep this for existing frontend-generated order notifications
  const addNotification = ({
    type = "general",
    title,
    message,
    link = "",
  }) => {
    if (!title || !message) return;

    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      link,
      createdAt: new Date().toISOString(),
      unread: true,
    };

    setNotifications((previous) => [
      newNotification,
      ...previous,
    ]);
  };

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      await api.patch(
        `/notifications/${id}/read`,
        {},
        authConfig
      );

      await fetchNotifications();
    } catch (error) {
      console.error("Could not mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.patch(
        "/notifications/read-all",
        {},
        authConfig
      );

      await fetchNotifications();
    } catch (error) {
      console.error("Could not mark all notifications as read:", error);
    }
  };

  // Delete one notification
  const removeNotification = async (id) => {
    try {
      await api.delete(
        `/notifications/${id}`,
        authConfig
      );

      await fetchNotifications();
    } catch (error) {
      console.error("Could not delete notification:", error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await api.delete("/notifications", authConfig);
      setNotifications([]);
    } catch (error) {
      console.error("Could not clear notifications:", error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        fetchNotifications,
        checkReminders,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
