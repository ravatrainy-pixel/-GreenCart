import { Link } from "react-router-dom";
import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import { useNotifications } from "../context/NotificationContext";
import "../styles/Navbar.css";

function Navbar() {
  const { cartCount } = useCart();

  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  
  return (
    <header className="navbar">

      {/* =========================================
          LOGO
      ========================================= */}

      <Link to="/" className="navbar-logo">

        <div className="logo-icon">
          🌿
        </div>

        <div className="logo-content">

          <h2>
            GreenCart
          </h2>

          <span>
            Organic • Sustainable • Better
          </span>

        </div>

      </Link>


      {/* =========================================
          NAVIGATION
      ========================================= */}

      <nav className="navbar-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/shop">
          Shop
        </Link>

        <Link to="/categories">
          Categories
        </Link>

        {/* AI RECOMMENDATION */}

        <Link to="/ai-recommendation">
          AI Recommendation
        </Link>

        <Link to="/my-orders">
          My Orders
        </Link>

        <Link to="/about">
          About
        </Link>

      </nav>


      {/* =========================================
          RIGHT SIDE
      ========================================= */}

      <div className="navbar-actions">

        {/* WISHLIST */}

        <Link
          to="/wishlist"
          className="navbar-wishlist"
          aria-label="Wishlist"
        >

          <span className="wishlist-nav-icon">
            {wishlistCount > 0 ? "♥" : "♡"}
          </span>

          <span className="wishlist-nav-text">
            Wishlist
          </span>

          {wishlistCount > 0 && (
            <span className="wishlist-count">
              {wishlistCount}
            </span>
          )}

        </Link>


        {/* CART */}

        <Link
          to="/cart"
          className="navbar-cart"
          aria-label="Cart"
        >

          <span className="cart-icon">
            🛒
          </span>

          <span className="cart-text">
            Cart
          </span>

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}

        </Link>
        
        {/* NOTIFICATIONS */}
<Link
  to="/notifications"
  className="navbar-notification"
  aria-label="Notifications"
>
  <span className="notification-nav-icon">
    🔔
  </span>

  <span className="notification-nav-text">
    Notifications
  </span>

  {unreadCount > 0 && (
  <span className="notification-nav-count">
    {unreadCount}
  </span>
)}
</Link>

        {/* ACCOUNT */}

        <Link
  to="/account"
  className="account-button"
  aria-label="Account"
>
  👤
</Link>

      </div>

    </header>
  );
}

export default Navbar;