import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminRatings.css";

const API_URL = "http://127.0.0.1:5000";

function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const token = localStorage.getItem("greencartAdminToken");

        const response = await axios.get(`${API_URL}/api/admin/ratings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRatings(response.data.ratings || []);
        setAverageRating(response.data.averageRating || 0);
      } catch (err) {
        console.error("Failed to fetch ratings:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load ratings. Please log in again and retry."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  if (loading) {
    return <div className="ratings-page">Loading ratings...</div>;
  }

  if (error) {
    return (
      <div className="ratings-page">
        <h2>Ratings & Feedback</h2>
        <p className="ratings-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="ratings-page">
      <div className="ratings-header">
        <div>
          <h1>Ratings & Feedback</h1>
          <p>Review customer ratings for your GreenCart products.</p>
        </div>
      </div>

      <div className="ratings-summary">
        <div className="rating-stat">
          <span>Total Ratings</span>
          <strong>{ratings.length}</strong>
        </div>

        <div className="rating-stat">
          <span>Average Rating</span>
          <strong>
            {Number(averageRating).toFixed(1)} <span className="rating-star">★</span>
            <small> / 5</small>
          </strong>
        </div>
      </div>

      <div className="ratings-table-card">
        <h2>Customer Ratings</h2>

        {ratings.length === 0 ? (
          <p className="ratings-empty">No ratings have been submitted yet.</p>
        ) : (
          <div className="ratings-table-wrapper">
            <table className="ratings-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {ratings.map((item, index) => (
                  <tr key={item.id || `${item.productId}-${index}`}>
                    <td>
                      <div className="rated-product">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName || "Product"}
                          />
                        )}
                        <span>{item.productName || "Unknown product"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="rated-customer">
                        <strong>{item.customerName || "Not recorded"}</strong>
                        {item.customerEmail && <small>{item.customerEmail}</small>}
                      </div>
                    </td>

                    <td>
                      <span className="rating-value">
                        {"★".repeat(
                          Math.max(
                            0,
                            Math.min(5, Math.round(Number(item.rating) || 0))
                          )
                        )}
                        <small> {Number(item.rating || 0).toFixed(1)}/5</small>
                      </span>
                    </td>

                    <td>{item.review || "No written feedback"}</td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRatings;