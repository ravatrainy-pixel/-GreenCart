
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../api/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("greencartUser");
      const token = localStorage.getItem("greencartToken");

      // Do not restore an old mock login without a backend token.
      if (!savedUser || !token) return null;

      const parsedUser = JSON.parse(savedUser);

      // Keep only safe user details, never a stored password.
      const { id, name, email, role } = parsedUser;
      return { id, name, email, role };
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("greencartToken")
  );

  // Verify the saved token when the application opens or refreshes.
  useEffect(() => {
    let cancelled = false;

    const verifyLogin = async () => {
      if (!token) {
        setUser(null);
        localStorage.removeItem("greencartLoggedIn");
        return;
      }

      try {
        const response = await getCurrentUser(token);

        if (cancelled) return;

        const currentUser = response.user;
        setUser(currentUser);
        localStorage.setItem(
          "greencartUser",
          JSON.stringify(currentUser)
        );
        localStorage.setItem("greencartLoggedIn", "true");
      } catch {
        if (cancelled) return;

        setUser(null);
        setToken(null);
        localStorage.removeItem("greencartToken");
        localStorage.removeItem("greencartUser");
        localStorage.removeItem("greencartLoggedIn");
      }
    };

    verifyLogin();

    return () => {
      cancelled = true;
    };
  }, [token]);

  
const register = async (name, email, password) => {
  try {
    const response = await registerUser(name, email, password);

    return {
      success: true,
      message:
        response.message ||
        "Account created. Please check your email to verify your account.",
      requiresEmailVerification:
        response.requiresEmailVerification ?? true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Registration failed. Please check your backend connection.",
    };
  }
};


  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);

      const accessToken = response.access_token;
      const loggedInUser = response.user;

      if (!accessToken || !loggedInUser) {
        return {
          success: false,
          message: "The server returned an invalid login response.",
        };
      }

      // Never save the customer's password in localStorage.
      const safeUser = {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        role: loggedInUser.role,
      };

      localStorage.setItem("greencartToken", accessToken);
      localStorage.setItem("greencartUser", JSON.stringify(safeUser));
      localStorage.setItem("greencartLoggedIn", "true");

      setToken(accessToken);
      setUser(safeUser);

      return {
        success: true,
        message: response.message || "Login successful.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Login failed. Please check your email and password.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("greencartToken");
    localStorage.removeItem("greencartUser");
    localStorage.removeItem("greencartLoggedIn");
  };

  const updateUser = (updatedData) => {
    if (!user) return;

    const safeUpdates = { ...updatedData };
    delete safeUpdates.password;

    const updatedUser = { ...user, ...safeUpdates };

    setUser(updatedUser);
    localStorage.setItem("greencartUser", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, register, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}