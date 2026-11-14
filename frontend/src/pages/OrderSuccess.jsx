import { Link, useLocation } from "react-router-dom";
import "../styles/OrderSuccess.css";

function OrderSuccess() {
  const location = useLocation();

  const paymentMethod =
    location.state?.paymentMethod || "cod";

  const totalAmount =
    location.state?.totalAmount || 0;

  const isUPI = paymentMethod === "upi";

  return (
    <section className="order-success">

      <div className="success-card">

        {/* Success Icon */}
        <div className="success-icon">
          ✓
        </div>

        <span className="success-label">
          GREENCART
        </span>

        <h1>
          Order Placed Successfully!
        </h1>

        <p className="success-message">
          Thank you for choosing GreenCart.
          Your order has been received and will
          be processed shortly.
        </p>


        {/* Order Details */}
        <div className="success-details">

          {/* Payment */}
          <div className="success-detail">

            <span>
              Payment
            </span>

            <strong>
              {isUPI
                ? "UPI Payment"
                : "Cash on Delivery"
              }
            </strong>

          </div>


          {/* Payment Status */}
          <div className="success-detail">

            <span>
              Payment Status
            </span>

            <strong>
              {isUPI
                ? "Paid"
                : "Pay on Delivery"
              }
            </strong>

          </div>


          {/* Total */}
          <div className="success-detail">

            <span>
              Order Total
            </span>

            <strong>
              ₹{totalAmount}
            </strong>

          </div>

        </div>


        {/* Additional Message */}

        <div className="success-payment-message">

          {isUPI ? (
            <>
              <strong>
                ✓ Payment Successful
              </strong>

              <p>
                Your UPI payment has been completed
                and your order is confirmed.
              </p>
            </>
          ) : (
            <>
              <strong>
                Cash on Delivery
              </strong>

              <p>
                Please keep ₹{totalAmount} ready
                when your order is delivered.
              </p>
            </>
          )}

        </div>


        {/* Buttons */}

        <div className="success-actions">

          <Link
            to="/shop"
            className="success-shop-button"
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            className="success-home-button"
          >
            Back to Home
          </Link>

        </div>

      </div>

    </section>
  );
}

export default OrderSuccess;