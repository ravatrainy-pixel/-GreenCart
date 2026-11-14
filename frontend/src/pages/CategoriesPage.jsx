
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/CategoriesPage.css";

const categoryIcons = {
  Clothing: "👕",
  "Hair care": "💆‍♀️",
  "Home Essentials": "🏡",
  "Organic Snacks": "🥜",
  "Skin Care": "🌸",
};

const categoryClasses = {
  Clothing: "clothing",
  "Hair care": "hair-care",
  "Home Essentials": "home-essentials",
  "Organic Snacks": "organic-snacks",
  "Skin Care": "skin-care",
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
        console.error("Failed to load categories:", err);
        setError("Unable to load categories. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="categories-page">
      <section className="categories-hero">
        <div className="categories-hero-content">
          <span className="categories-label">
            EXPLORE GREENCART
          </span>
          <h1>
            Shop by <span>Category</span>
          </h1>
          <p>
            Discover natural, organic and sustainable
            products made for a better everyday lifestyle.
          </p>
        </div>
        <div className="categories-hero-decoration">🌿</div>
      </section>

      <section className="categories-section">
        <div className="categories-heading">
          <div>
            <span>FIND WHAT YOU NEED</span>
            <h2>Explore Our Categories</h2>
          </div>
          <p>
            Choose a category and discover products
            selected for conscious living.
          </p>
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
              <Link
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className={`category-card ${
                  categoryClasses[category.name] || ""
                }`}
                key={category._id || category.name}
              >
                <div className="category-leaf-decoration">✦</div>

                <div className="category-icon">
                  {categoryIcons[category.name] || "🌿"}
                </div>

                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p>
                    {category.description ||
                      "Explore our natural and sustainable products."}
                  </p>
                  <span className="category-explore">
                    Explore Products →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="categories-cta">
        <div>
          <span>MAKE A BETTER CHOICE</span>
          <h2>
            Small Choices.
            <br />
            Bigger Impact. 🌱
          </h2>
          <p>
            Choose products that are better for you
            and kinder to the planet.
          </p>
          <Link to="/shop" className="categories-cta-button">
            Shop All Products
          </Link>
        </div>
        <div className="categories-cta-leaves">🌿</div>
      </section>
    </div>
  );
}

export default Categories;
