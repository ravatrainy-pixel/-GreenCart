import { Link } from "react-router-dom";
import useCart from "../context/useCart";
import "../styles/Cart.css";

function Cart() {
  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <section className="empty-cart">

        <div className="empty-cart-icon">
          🛒
        </div>

        <h1>Your Cart is Empty</h1>

        <p>
          Looks like you haven't added anything
          to your cart yet.
        </p>

        <Link
          to="/shop"
          className="continue-shopping"
        >
          Continue Shopping
        </Link>

      </section>
    );
  }

  return (
    <section className="cart-section">

      <div className="cart-heading">
        <span>🌿 GREENCART</span>

        <h1>Your Shopping Cart</h1>

        <p>
          Review your selected products before
          checkout.
        </p>
      </div>

      <div className="cart-layout">

        {/* Cart Items */}
        <div className="cart-items">

          {cartItems.map((item) => (
            <div
              className="cart-item"
              key={item.id}
            >

              <div className="cart-product-images">
              {(Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : [item.image]
              )
                .filter((img) => typeof img === "string" && img.trim() !== "")
                .map((img, index) => (
                  <img
                    key={`${index}-${img.slice(0, 30)}`}
                    src={img}
                    alt={`${item.name} view ${index + 1}`}
                    className="cart-product-thumbnail"
                  />
                ))}
            </div>

              <div className="cart-item-info">

                <span className="cart-item-category">
                  {item.category}
                </span>

                <h3>{item.name}</h3>

                <span className="cart-item-price">
                  ₹{item.price}
                </span>

                <div className="cart-item-actions">

                  <div className="cart-quantity">

                    <button
                      onClick={() =>
                        decreaseQuantity(item.id)
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        increaseQuantity(item.id)
                      }
                    >
                      +
                    </button>

                  </div>

                  <button
                    className="remove-cart-item"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                  >
                    Remove
                  </button>

                </div>

              </div>

              <strong className="cart-item-total">
                ₹{item.price * item.quantity}
              </strong>

            </div>
          ))}

        </div>

        {/* Summary */}
        <div className="cart-summary">

          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>₹{cartTotal}</strong>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <strong className="free-shipping">
              FREE
            </strong>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total</span>
            <strong>₹{cartTotal}</strong>
          </div>
          
          <Link
              to="/checkout"
              className="checkout-button"
            >
              Proceed to Checkout →
          </Link>

          <Link
            to="/shop"
            className="continue-shopping-small"
          >
            ← Continue Shopping
          </Link>

        </div>

      </div>

    </section>
  );
}

export default Cart;