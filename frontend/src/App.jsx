
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import CartProvider from "./context/CartProvider";
import WishlistProvider from "./context/WishlistProvider";

import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminLayout from "./components/AdminLayout";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartNotification from "./components/CartNotification";

import Home from "./pages/Home";
import ShopPage from "./pages/ShopPage";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import CategoriesPage from "./pages/CategoriesPage";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import AdminOrders from "./pages/AdminOrders";
import AIRecommendation from "./pages/AIRecommendation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Notifications from "./pages/Notifications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminEditProduct from "./pages/AdminEditProduct";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";
import AdminAIRecommendations from "./pages/AdminAIRecommendations";
import VerifyEmail from "./pages/VerifyEmail";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminRatings from "./pages/AdminRatings";

function AppContent() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <Navbar />}
      {!isAdminPage && <CartNotification />}

      <main>
        <Routes>
          {/* CUSTOMER ROUTES */}

          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-details/:id" element={<OrderDetails />} />
          <Route path="/ai-recommendation" element={<AIRecommendation />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ADMIN LOGIN - PUBLIC ROUTE */}

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />

          {/* PROTECTED ADMIN ROUTES */}

          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>

              <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
              />

              <Route
                path="/admin/products"
                element={<AdminProducts />}
              />

              <Route
                path="/admin/products/add"
                element={<AdminAddProduct />}
              />

              <Route
                path="/admin/products/edit/:id"
                element={<AdminEditProduct />}
              />

              <Route
                path="/admin/orders"
                element={<AdminOrders />}
              />

              <Route
                path="/admin/users"
                element={<AdminUsers />}
              />

              <Route
                path="/admin/categories"
                element={<AdminCategories />}
              />

              <Route
                path="/admin/ai"
                element={<AdminAIRecommendations />}
              />

              <Route
                path="/admin/ratings"
                element={<AdminRatings />}
              />

            </Route>
          </Route>
        </Routes>
      </main>

      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      
        <AuthProvider>
          <NotificationProvider>
          <WishlistProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </WishlistProvider>
          </NotificationProvider>
        </AuthProvider>
    
    </BrowserRouter>
  );
}

export default App;
