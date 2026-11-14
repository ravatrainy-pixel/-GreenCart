
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/Register.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "Please wait while we verify your email..."
  );

  useEffect(() => {
    let cancelled = false;

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("The verification link is missing its token.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", {
          token,
        });

        if (cancelled) return;

        setStatus("success");
        setMessage(
          response.data.message ||
            "Your email has been verified successfully."
        );
      } catch (error) {
        if (cancelled) return;

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "We couldn't verify your email. Please try again."
        );
      }
    };

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <section className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-icon">🌿</div>
          <span className="register-tag">GREENCART ACCOUNT</span>
          <h1>
            {status === "verifying"
              ? "Verifying Email"
              : status === "success"
                ? "Email Verified!"
                : "Verification Failed"}
          </h1>
          <p role="status">{message}</p>
        </div>

        {status === "verifying" && <p>Please keep this page open.</p>}

        {status === "success" && (
          <Link to="/login" className="register-button">
            Continue to Login
          </Link>
        )}

        {status === "error" && (
          <Link to="/login" className="register-button">
            Go to Login
          </Link>
        )}
      </div>
    </section>
  );
}

export default VerifyEmail;
