
import {
  createContext,
  useContext,
  useState,
} from "react";
import api from "../api/axios";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem("greencartAdmin");

    if (!savedAdmin) {
      return null;
    }

    try {
      return JSON.parse(savedAdmin);
    } catch {
      localStorage.removeItem("greencartAdmin");
      localStorage.removeItem("greencartAdminToken");
      localStorage.removeItem("greencartAdminLoggedIn");

      return null;
    }
  });

  // Admin login using the Flask backend
  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post("/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;

      if (!data.success || !data.access_token || !data.user) {
        return {
          success: false,
          message: data.message || "Admin login failed.",
        };
      }

      const adminData = data.user;

      // Save the real JWT returned by the backend
      localStorage.setItem(
        "greencartAdminToken",
        data.access_token
      );

      // Save admin information
      localStorage.setItem(
        "greencartAdmin",
        JSON.stringify(adminData)
      );

      // Remove the old demo-login flag
      localStorage.removeItem("greencartAdminLoggedIn");

      setAdmin(adminData);

      return {
        success: true,
        message: "Admin login successful",
      };
    } catch (error) {
      console.error(
        "Admin login error:",
        error.response?.data || error.message
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      };
    }
  };

  // Admin logout
  const logoutAdmin = () => {
    localStorage.removeItem("greencartAdminToken");
    localStorage.removeItem("greencartAdmin");
    localStorage.removeItem("greencartAdminLoggedIn");

    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loginAdmin,
        logoutAdmin,
        isAdminLoggedIn: !!admin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook for accessing admin authentication
export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};
