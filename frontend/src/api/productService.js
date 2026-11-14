
import api from "./axios";

const getAdminHeaders = () => {
  const token = localStorage.getItem("greencartAdminToken");

  if (!token) {
    throw new Error("Admin token missing. Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Get all products (public API)
export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data.products;
};

// Get one product (public API)
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data.product;
};

// Add product (admin only)
export const addProduct = async (productData) => {
  const response = await api.post(
    "/products",
    productData,
    {
      headers: getAdminHeaders(),
    }
  );

  return response.data;
};

// Update product (admin only)
export const updateProduct = async (id, productData) => {
  const response = await api.put(
    `/products/${encodeURIComponent(id)}`,
    productData,
    {
      headers: getAdminHeaders(),
    }
  );

  return response.data;
};

// Delete product (admin only)
export const deleteProduct = async (id) => {
  const response = await api.delete(
    `/products/${encodeURIComponent(id)}`,
    {
      headers: getAdminHeaders(),
    }
  );

  return response.data;
};
