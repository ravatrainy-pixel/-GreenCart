
import useAuth from "../context/useAuth";
import { useEffect, useState } from "react";
import "../styles/ProductRating.css";

const API_URL = "http://127.0.0.1:5000";

export default function ProductRating({ productId }) {
  const { token, user } = useAuth();

  const [selectedRating, setSelectedRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRatings() {
    try {
      const response = await fetch(
        `${API_URL}/api/products/${productId}/ratings`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load ratings");
      }

      setAverageRating(Number(data.averageRating) || 0);
      setRatingCount(Number(data.ratingCount) || 0);
      setReviews(data.ratings || []);
    } catch (error) {
      setMessage(error.message || "Could not load ratings.");
    }
  }

  useEffect(() => {
    if (productId) {
      loadRatings();
    }
  }, [productId]);

  async function submitRating() {
    if (!token || !user) {
      setMessage("Please log in to submit a review.");
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setMessage("Please select a star rating.");
      return;
    }

    if (!review.trim()) {
      setMessage("Please write a review.");
      return;
    }

    if (review.trim().length > 500) {
      setMessage("Review cannot exceed 500 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/products/${productId}/ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: selectedRating,
            review: review.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit review.");
      }

      setMessage("Thank you for your review!");
      setSelectedRating(0);
      setReview("");
      await loadRatings();
    } catch (error) {
      setMessage(error.message || "Unable to submit review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="product-rating">
      <h3>Customer Ratings & Reviews</h3>

      <div className="rating-summary">
        <span className="rating-average">
          {averageRating.toFixed(1)}
        </span>

        <span className="rating-stars-display" aria-hidden="true">
          {"★".repeat(Math.round(averageRating))}
          {"☆".repeat(5 - Math.round(averageRating))}
        </span>

        <span className="rating-count">
          ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
        </span>
      </div>

      <div className="write-review">
        <h4>Write a Review</h4>

        <p className="rating-prompt">Rate this product:</p>

        <div className="rating-input" role="group" aria-label="Choose a rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={
                star <= (hoverRating || selectedRating)
                  ? "rating-star active"
                  : "rating-star"
              }
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              aria-pressed={selectedRating === star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onFocus={() => setHoverRating(star)}
              onBlur={() => setHoverRating(0)}
              onClick={() => setSelectedRating(star)}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="review-textarea"
          placeholder="Share your experience with this product..."
          value={review}
          onChange={(event) => setReview(event.target.value)}
          maxLength={500}
          rows={4}
        />

        <p className="review-character-count">
          {review.length}/500 characters
        </p>

        <button
          type="button"
          className="submit-rating-button"
          onClick={submitRating}
          disabled={loading || selectedRating === 0 || !review.trim()}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      {message && (
        <p className="rating-message" role="status">
          {message}
        </p>
      )}

      <div className="customer-reviews">
        <h4>Customer Reviews ({reviews.length})</h4>

        {reviews.length === 0 ? (
          <p className="no-reviews">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((item, index) => (
            <article
              className="customer-review-card"
              key={`${item.customerName}-${item.createdAt}-${index}`}
            >
              <div className="customer-review-header">
                <strong>{item.customerName || "Customer"}</strong>

                <span className="customer-review-stars">
                  {"★".repeat(Number(item.rating) || 0)}
                  {"☆".repeat(5 - (Number(item.rating) || 0))}
                </span>
              </div>

              <p>{item.review || "No written review provided."}</p>

              {item.createdAt && (
                <small>
                  {new Date(item.createdAt).toLocaleDateString()}
                </small>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
