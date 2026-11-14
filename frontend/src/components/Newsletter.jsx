import { useState } from "react";
import "../styles/Newsletter.css";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setMessage("✓ Successfully subscribed to GreenCart!");

    setEmail("");
  };

  return (
    <section className="newsletter-section">

      <div className="newsletter-leaf newsletter-leaf-one">
        🌿
      </div>

      <div className="newsletter-content">

        {/* Icon */}
        <div className="newsletter-icon">
          ✉️
        </div>

        {/* Text */}
        <div className="newsletter-text">

          <span className="newsletter-tag">
            STAY CONNECTED
          </span>

          <h2>
            Get GreenCart Updates
          </h2>

          <p>
            Receive sustainable shopping tips, new product updates,
            exclusive offers and personalized recommendations.
          </p>

        </div>

        {/* Form */}
        <form
          className="newsletter-form"
          onSubmit={handleSubmit}
        >

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
          />

          <button type="submit">
            Subscribe
            <span>→</span>
          </button>

        </form>

        {/* Message */}
        {message && (
          <p
            className={
              message.startsWith("✓")
                ? "newsletter-success"
                : "newsletter-error"
            }
          >
            {message}
          </p>
        )}

      </div>

    </section>
  );
}

export default Newsletter;