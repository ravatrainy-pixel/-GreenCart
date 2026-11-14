
import api from "./axios";

// Customer authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("greencartToken");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// Admin authentication headers
const getAdminAuthHeaders = () => {
  const token = localStorage.getItem("greencartAdminToken");

  if (!token) {
    throw new Error("Please log in to the admin panel again.");
  }

  return { Authorization: `Bearer ${token}` };
};

// Create a new customer order
export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Get orders belonging to the logged-in customer
export const getOrders = async () => {
  const response = await api.get("/orders", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Get all orders for the admin panel
export const getAdminOrders = async () => {
  const response = await api.get("/admin/orders", {
    headers: getAdminAuthHeaders(),
  });

  return response.data;
};

// Get one order belonging to the logged-in customer
export const getOrderById = async (orderId) => {
  const response = await api.get(
    `/orders/${encodeURIComponent(orderId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// Update order status from the admin panel
export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(
    `/orders/${encodeURIComponent(orderId)}/status`,
    { status },
    {
      headers: getAdminAuthHeaders(),
    }
  );

  return response.data;
};
