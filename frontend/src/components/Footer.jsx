import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span>🌱</span>
            <strong>GreenCart</strong>
          </div>

          <p>
            Your destination for organic, sustainable and
            thoughtfully selected everyday products.
          </p>

          <div className="footer-socials">
            <button title="Instagram">📷</button>
            <button title="Facebook">f</button>
            <button title="LinkedIn">in</button>
            <button title="YouTube">▶</button>
          </div>
        </div>

        {/* Shop */}
        <div className="footer-column">
          <h3>Shop</h3>

          <a href="#shop">All Products</a>
          <a href="#categories">Hair Care</a>
          <a href="#categories">Skin Care</a>
          <a href="#categories">Personal Care</a>
          <a href="#categories">Household</a>
        </div>

        {/* GreenCart */}
        <div className="footer-column">
          <h3>GreenCart</h3>

          <a href="#about">About Us</a>
          <a href="#ai">AI Recommendations</a>
          <a href="#sustainability">Sustainability</a>
          <a href="#contact">Contact Us</a>
          <a href="#faq">FAQs</a>
        </div>

        {/* Account */}
        <div className="footer-column">
          <h3>My Account</h3>

          <a href="#login">Login</a>
          <a href="#register">Create Account</a>
          <a href="#wishlist">Wishlist</a>
          <a href="#cart">Shopping Cart</a>
          <a href="#orders">My Orders</a>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © 2026 GreenCart. All rights reserved.
        </p>

        <div>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms & Conditions</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;