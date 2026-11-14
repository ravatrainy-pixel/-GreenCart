import { createOrder } from "../api/orderService";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useCart from "../context/useCart";
import "../styles/Checkout.css";

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [upiId, setUpiId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const deliveryCharge = cartTotal >= 499 ? 0 : 40;

const discount = appliedCoupon === "GREEN10"
  ? Number((cartTotal * 0.10).toFixed(2))
  : appliedCoupon === "SAVE50"
    ? Math.min(50, cartTotal)
    : 0;

const finalTotal = Math.max(
  0,
  cartTotal + deliveryCharge - discount
);

const handleApplyCoupon = () => {
  const code = couponInput.trim().toUpperCase();

  if (code === "GREEN10" || code === "SAVE50") {
    setAppliedCoupon(code);
    setCouponMessage(`${code} applied successfully!`);
  } else {
    setAppliedCoupon("");
    setCouponMessage("Invalid coupon code.");
  }
};

const handleRemoveCoupon = () => {
  setAppliedCoupon("");
  setCouponInput("");
  setCouponMessage("");
};

  // Demo UPI payment only; this does not process real payments.
  const handleUpiPayment = () => {
    if (!upiId.trim()) {
      alert("Please enter your UPI ID.");
      return;
    }

    setPaymentStatus("processing");

    setTimeout(() => {
      setPaymentStatus("success");
    }, 1500);
  };

  // Save the order to MongoDB through Flask.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || cartItems.length === 0) {
      return;
    }

    if (
      paymentMethod === "upi" &&
      paymentStatus !== "success"
    ) {
      alert("Please complete the UPI payment first.");
      return;
    }

    setIsSubmitting(true);

    const orderId = "GC" + Date.now().toString().slice(-8);

    
const newOrder = {
  id: orderId,
  date: new Date().toISOString(),
  couponCode: appliedCoupon,
  customer: {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
  },

  shippingAddress: {
    address: formData.address,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
  },

  items: cartItems.map((item) => ({ ...item })),
  totalAmount: finalTotal,
  paymentMethod,
  paymentStatus:
    paymentMethod === "upi"
      ? "Paid"
      : "Pending",
  orderStatus: "Confirmed",
  
};


    try {
      
const result = await createOrder(newOrder);

if (!result.success) {
  throw new Error(
    result.message || "Could not save your order."
  );
}
  

      clearCart();

      navigate("/order-success", {
        state: {
          paymentMethod,
          totalAmount: finalTotal,
          orderId,
        },
      });   
    
} catch (error) {
  console.error("Order submission failed:", error);

  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Unable to place your order. Please try again.";

  alert(message);
} finally {

      setIsSubmitting(false);
    }
  };

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <section className="checkout-empty">
        <div className="checkout-empty-icon">🛒</div>

        <h1>Your Cart is Empty</h1>

        <p>
          Add some products to your cart before
          proceeding to checkout.
        </p>

        <Link to="/shop" className="checkout-shop-button">
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <span>🌿 GREENCART CHECKOUT</span>

        <h1>Complete Your Order</h1>

        <p>
          Enter your delivery details and choose
          your preferred payment method.
        </p>
      </div>

      <form
        className="checkout-layout"
        onSubmit={handleSubmit}
      >
        <div className="checkout-main">
          {/* Delivery information */}
          <div className="checkout-card">
            <h2>Delivery Information</h2>

            <p className="checkout-card-description">
              Where should we deliver your order?
            </p>

            <div className="checkout-form-grid">
              <div className="checkout-field full-width">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="checkout-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="checkout-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="checkout-field full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House no., street, area..."
                  rows="3"
                  required
                />
              </div>

              <div className="checkout-field">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>

              <div className="checkout-field">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />
              </div>

              <div className="checkout-field">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="checkout-card">
            <h2>Payment Method</h2>

            <p className="checkout-card-description">
              Choose how you want to pay.
            </p>

            <div className="payment-options">
              <label
                className={
                  paymentMethod === "cod"
                    ? "payment-option active"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setPaymentStatus("pending");
                  }}
                />

                <div>
                  <strong>Cash on Delivery</strong>
                  <span>Pay when your order arrives.</span>
                </div>
              </label>

              <label
                className={
                  paymentMethod === "upi"
                    ? "payment-option active"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setPaymentStatus("pending");
                  }}
                />

                <div>
                  <strong>UPI Payment</strong>
                  <span>
                    Demo payment using your UPI ID or QR code.
                  </span>
                </div>
              </label>
            </div>

            {/* Demo UPI section */}
            {paymentMethod === "upi" && (
              <div className="upi-payment-box">
                <div className="upi-heading">
                  <h3>Pay with UPI</h3>
                  <span>Demo Payment</span>
                </div>

                <div className="upi-amount">
                  <span>Amount to Pay</span>
                  <strong>₹{finalTotal}</strong>
                </div>

                <div className="upi-field">
                  <label>Enter UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                    disabled={paymentStatus === "success"}
                  />
                </div>

                <div className="upi-or">
                  <span></span>
                  OR
                  <span></span>
                </div>

                <div className="upi-qr-section">
                  <h4>Scan QR Code</h4>

                  <div className="upi-qr-box">
                    <div className="qr-placeholder">
                      <span>QR</span>
                    </div>
                  </div>

                  <p>
                    Demo placeholder; no real QR payment is processed.
                  </p>
                </div>

                {paymentStatus !== "success" && (
                  <button
                    type="button"
                    className="upi-pay-button"
                    onClick={handleUpiPayment}
                    disabled={paymentStatus === "processing"}
                  >
                    {paymentStatus === "processing"
                      ? "Processing Payment..."
                      : `Pay ₹${cartTotal} Now →`}
                  </button>
                )}

                {paymentStatus === "success" && (
                  <div className="upi-success">
                    <div className="upi-success-icon">✓</div>

                    <div>
                      <strong>Demo Payment Successful</strong>
                      <span>
                        The simulated payment step is complete.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="checkout-products">
            {cartItems.map((item) => (
              <div
                className="checkout-product"
                key={item.id}
              >
                <img src={item.image} alt={item.name} />

                <div>
                  <strong>{item.name}</strong>
                  <span>Qty: {item.quantity}</span>
                </div>

                <b>₹{item.price * item.quantity}</b>
              </div>
            ))}
          </div>
          
          <div className="coupon-section">
            <h3>Apply Coupon</h3>

            <div className="coupon-input-row">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                disabled={!!appliedCoupon}
              />

              {appliedCoupon ? (
                <button type="button" onClick={handleRemoveCoupon}>
                  Remove
                </button>
              ) : (
                <button type="button" onClick={handleApplyCoupon}>
                  Apply
                </button>
              )}
            </div>

            {couponMessage && (
              <p className={appliedCoupon ? "coupon-success" : "coupon-error"}>
                {couponMessage}
              </p>
            )}

            <p className="coupon-hint">
              Try GREEN10 or SAVE50
            </p>
          </div>

          <div className="checkout-summary-line">
            <span>Subtotal</span>
            <strong>₹{cartTotal}</strong>
          </div>

          <div className="checkout-summary-line">
            <span>Shipping</span>
            <strong>
              {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
            </strong>
          </div>

          {discount > 0 && (
            <div className="checkout-summary-line">
              <span>Discount ({appliedCoupon})</span>
              <strong className="coupon-success">
                -₹{discount}
              </strong>
            </div>
          )}

          <div className="checkout-summary-divider"></div>

          <div className="checkout-total">
            <span>Total</span>
            <strong>₹{finalTotal}</strong>
          </div>

          <button
            type="submit"
            className="place-order-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving Your Order..."
              : paymentMethod === "upi"
                ? paymentStatus === "success"
                  ? "Place Order →"
                  : "Complete Payment First"
                : "Place Order →"}
          </button>

          <Link to="/cart" className="back-to-cart">
            ← Back to Cart
          </Link>
        </aside>
      </form>
    </section>
  );
}

export default Checkout;
