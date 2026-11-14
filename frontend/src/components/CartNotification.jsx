import useCart from "../context/useCart";
import "../styles/CartNotification.css";

function CartNotification() {
  const { cartMessage } = useCart();

  if (!cartMessage) {
    return null;
  }

  return (
    <div className="cart-notification">

      <div className="notification-check">
        ✓
      </div>

      <div className="notification-content">
        <strong>Added to Cart</strong>

        <span>{cartMessage}</span>
      </div>

    </div>
  );
}

export default CartNotification;