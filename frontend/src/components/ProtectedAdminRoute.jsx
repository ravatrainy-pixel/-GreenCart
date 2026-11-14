import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

function ProtectedAdminRoute() {
  const { isAdminLoggedIn } = useAdminAuth();

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

export default ProtectedAdminRoute;