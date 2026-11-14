
import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/Categories.css";

const categoryIcons = {
  Clothing: "👕",
  "Hair care": "💆‍♀️",
  "Home Essentials": "🏡",
  "Organic Snacks": "🥜",
  "Skin Care": "🌸",
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((response) => {
        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data.categories || [];

        setCategories(list);
      })
      .catch((err) => {
        console.error("Categories API error:", err);
        setError("Unable to load categories. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="categories-section" id="categories">
      <div className="categories-header">
        <div>
          <p className="section-tag">EXPLORE OUR COLLECTION</p>
          <h2>
            Shop by <span>Category</span>
          </h2>
          <p className="section-description">
            Discover organic and sustainable products carefully selected
            for you and the planet.
          </p>
        </div>

        <button
          className="view-all-button"
          onClick={() => {
            window.location.href = "/products";
          }}
        >
          View All Products →
        </button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : categories.length === 0 ? (
        <p>No categories available yet.</p>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div className="category-card" key={category._id || category.name}>
              <div className="category-icon">
                {categoryIcons[category.name] || "🌿"}
              </div>

              <div className="category-content">
                <h3>{category.name}</h3>
                <p>
                  {category.description ||
                    "Explore our natural and sustainable products."}
                </p>
              </div>

              <button
                className="category-arrow"
                aria-label={`View ${category.name} products`}
                onClick={() => {
                  window.location.href = `/products?category=${encodeURIComponent(
                    category.name
                  )}`;
                }}
              >
                →
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Categories;
