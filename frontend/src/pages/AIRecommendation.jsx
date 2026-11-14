
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import "../styles/AIRecommendation.css";

const categoryIcons = {
  "Hair Care": "💆",
  "Hair care": "💆",
  "Skin Care": "✨",
  "Organic Snacks": "🥜",
  "Clothing": "👕",
  "Home Essentials": "🏡",
};

const defaultNeeds = {
  "Hair Care": [
    "Hair Fall",
    "Dry Hair",
    "Dandruff",
    "Frizzy Hair",
    "Hair Growth",
  ],
  "Hair care": [
    "Hair Fall",
    "Dry Hair",
    "Dandruff",
    "Frizzy Hair",
    "Hair Growth",
  ],
  "Skin Care": [
    "Dry Skin",
    "Oily Skin",
    "Acne Care",
    "Glow",
    "Sensitive Skin",
  ],
  "Organic Snacks": [
    "Healthy Snacks",
    "Organic Ingredients",
    "Natural Snacks",
    "Daily Snacks",
  ],
  Clothing: [
    "Comfortable Clothing",
    "Natural Fabrics",
    "Daily Wear",
    "Eco Friendly",
  ],
  "Home Essentials": [
    "Cleaning",
    "Kitchen",
    "Home Care",
    "Eco Friendly",
  ],
};

function getProductCategory(product) {
  const category = product?.category;

  if (typeof category === "object" && category !== null) {
    return category.name || category.title || "";
  }

  return category || "";
}

function getProductId(product) {
  return product?._id || product?.id || product?.productId;
}

function AIRecommendation() {
  const [category, setCategory] = useState("");
  const [need, setNeed] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [showAssistantResults, setShowAssistantResults] = useState(false);
    
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  // Load categories from Flask backend / MongoDB.
  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        setLoadingCategories(true);

        const response = await api.get("/categories");
        const categoryList = response.data?.categories || [];

        if (!active) return;

        setCategories(
          categoryList
            .map((item) => ({
              name: item.name || item.title,
              icon:
                categoryIcons[item.name || item.title] || "🌿",
            }))
            .filter((item) => item.name)
        );
      } catch (err) {
        console.error("Error loading categories:", err);

        if (active) {
          setError(
            "Unable to load categories. Please check your backend."
          );
        }
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  // Load products from the backend.
  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoadingProducts(true);

        // Uses the existing products endpoint through your API helper.
        const response = await api.get("/products");

        const productList = Array.isArray(response.data)
          ? response.data
          : response.data?.products ||
            response.data?.data?.products ||
            [];

        if (active) {
          setProducts(Array.isArray(productList) ? productList : []);
        }
      } catch (err) {
        console.error("Error loading products:", err);

        if (active) {
          setProducts([]);
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  const needs = defaultNeeds[category] || [
    "Daily Use",
    "Natural Ingredients",
    "Eco Friendly",
  ];

  const handleCategoryChange = (value) => {
    setCategory(value);
    setNeed("");
    setShowResults(false);
    setError("");
  };

  const handleRecommendation = () => {
    if (!category || !need) {
      setError("Please select a category and your main need.");
      return;
    }

    setError("");
    setShowResults(true);
  };

  console.log("Selected category:", category);
  console.log("Selected need:", need);
  console.log("Products loaded:", products.length);
  console.log(
    "Product categories:",
    products.map((product) => ({
      name: product.name,
      category: getProductCategory(product),
    }))
  );
  console.log(
  "Available product categories:",
  [...new Set(products.map((product) => getProductCategory(product)))]
);

console.log(
  "Clothing products:",
  products.filter(
    (product) =>
      getProductCategory(product).trim().toLowerCase() ===
      category.trim().toLowerCase()
  )
);
  // Match products to the selected MongoDB category and preference.
  const recommendedProducts = products
    .filter((product) => {
      return (
        getProductCategory(product).trim().toLowerCase() ===
        category.trim().toLowerCase()
      );
    })
    .map((product) => {
      const text = [
        product.name,
        product.description,
        getProductCategory(product),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchWords = need.toLowerCase().split(/\s+/);

      const matchesNeed = searchWords.some(
        (word) => word.length > 2 && text.includes(word)
      );

      return {
        ...product,
        recommendationScore: matchesNeed ? 2 : 1,
      };
    })
    .sort(
      (a, b) => b.recommendationScore - a.recommendationScore
    )
    .slice(0, 4);
    // AI SHOPPING ASSISTANT LOGIC

const findAssistantProducts = () => {
  if (
    minBudget !== "" &&
    maxBudget !== "" &&
    Number(minBudget) > Number(maxBudget)
  ) {
    setShowAssistantResults(false);
    setError("Maximum budget must be greater than or equal to minimum budget.");
    return;
  }

  setError("");
  setShowAssistantResults(true);
};

const assistantProducts = products
  .map((product) => {
    const name = product.name || product.title || "";
    const productCategory = getProductCategory(product);
    const description = product.description || "";

    const searchableText =
      `${name} ${productCategory} ${description}`.toLowerCase();

    const ignoredWords = [
      "find",
      "show",
      "want",
      "need",
      "under",
      "below",
      "above",
      "with",
      "from",
      "products",
      "product",
      "please",
      "suggest",
      "recommend",
      "looking",
      "for",
      "the",
      "and",
      "get",
      "me",
    ];

    const queryWords = assistantQuery
      .toLowerCase()
      .replace(/[₹,]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 && !ignoredWords.includes(word)
      );

    const price = Number(product.price);

    const hasValidPrice =
      product.price !== null &&
      product.price !== undefined &&
      product.price !== "" &&
      Number.isFinite(price);

    const minimum =
      minBudget === "" ? 0 : Number(minBudget);

    const maximum =
      maxBudget === "" ? Infinity : Number(maxBudget);

    const matchesBudget =
      hasValidPrice &&
      price >= minimum &&
      price <= maximum;

    const matchedWords = queryWords.filter((word) =>
      searchableText.includes(word)
    );

    return {
      ...product,
      assistantScore: matchedWords.length,
      matchesBudget,
    };
  })
  .filter((product) => {
    if (!product.matchesBudget) {
      return false;
    }

    if (assistantQuery.trim()) {
      return product.assistantScore > 0;
    }

    return true;
  })
  .sort(
    (a, b) => b.assistantScore - a.assistantScore
  )
  .slice(0, 8);
  return (
    <div className="ai-recommendation-page">
      {/* HERO */}
      <section className="ai-page-hero">
        <span className="ai-page-tag">🌿 GREENCART AI</span>

        <h1>
          Find Products
          <span> Made for You</span>
        </h1>

        <p>
          Tell us what you need and GreenCart will suggest
          products that match your lifestyle.
        </p>
      </section>

      {/* RECOMMENDATION FORM */}
      <section className="ai-recommendation-box">
        <div className="ai-step">
          <span className="ai-step-number">01</span>

          <div>
            <h2>What are you looking for?</h2>
            <p>Choose a product category.</p>
          </div>
        </div>

        {loadingCategories ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found in the database.</p>
        ) : (
          <div className="ai-category-grid">
            {categories.map((item) => (
              <button
                type="button"
                key={item.name}
                className={
                  category === item.name
                    ? "ai-option active"
                    : "ai-option"
                }
                onClick={() => handleCategoryChange(item.name)}
              >
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* NEED */}
        {category && (
          <div className="ai-needs-section">
            <div className="ai-step">
              <span className="ai-step-number">02</span>

              <div>
                <h2>What is your main need?</h2>
                <p>Select what you want help with.</p>
              </div>
            </div>

            <div className="ai-needs-grid">
              {needs.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    need === item ? "ai-need active" : "ai-need"
                  }
                  onClick={() => {
                    setNeed(item);
                    setShowResults(false);
                    setError("");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p role="alert">{error}</p>}

        {/* BUTTON */}
        <button
          type="button"
          className="ai-recommend-button"
          disabled={
            !category ||
            !need ||
            loadingCategories ||
            loadingProducts
          }
          onClick={handleRecommendation}
        >
          {loadingProducts
            ? "Loading Products..."
            : "✨ Get My Recommendations"}
          <span>→</span>
        </button>
      </section>
      {showResults && (
        <section className="ai-results">
          <div className="ai-results-heading">
            <div>
              <span>YOUR PERSONALIZED RESULTS</span>
              <h2>Recommended for You</h2>

              <p>
                Category: <strong>{category}</strong> · Need:
                <strong> {need}</strong>
              </p>
            </div>
          </div>

          {recommendedProducts.length > 0 ? (
            <div className="ai-results-grid">
              {recommendedProducts.map((product, index) => {
                const id = getProductId(product);
                const image =
                  product.image ||
                  product.imageUrl ||
                  product.thumbnail;

                return (
                  <div
                    className="ai-product-card"
                    key={id || `${product.name}-${index}`}
                  >
                    <div className="ai-product-image">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name || "GreenCart product"}
                        />
                      ) : (
                        <span>🌿</span>
                      )}
                    </div>

                    <div className="ai-product-info">
                      <span>{getProductCategory(product)}</span>

                      <h3>{product.name || product.title}</h3>

                      <p>
                        {product.description ||
                          "A thoughtfully selected product from GreenCart."}
                      </p>

                      <div className="ai-product-bottom">
                        <strong>
                          ₹{Number(product.price || 0).toFixed(2)}
                        </strong>

                        {id ? (
                          <Link to={`/product/${id}`}>
                            View Product →
                          </Link>
                        ) : (
                          <Link to="/shop">View Shop →</Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ai-no-results">
              <span>🌿</span>
              <h3>No matching products found</h3>
              <p>
                No products are currently listed under{" "}
                <strong>{category}</strong>. Try another category,
                or check that your products use the same category
                names as the database.
              </p>
            </div>
          )}
        </section>
      )}
            {/* AI SHOPPING ASSISTANT */}
      <section className="ai-assistant-box">
        <div className="ai-assistant-heading">
          <span className="ai-assistant-icon">🤖</span>

          <div>
            <span className="ai-page-tag">
              YOUR SMART SHOPPING HELPER
            </span>

            <h2>Ask GreenCart Assistant</h2>

            <p>
              Describe what you need and set your budget
              to discover matching products.
            </p>
          </div>
        </div>

        <label htmlFor="assistant-query">
          What are you looking for?
        </label>

        <textarea
          id="assistant-query"
          value={assistantQuery}
          onChange={(event) => {
            setAssistantQuery(event.target.value);
            setShowAssistantResults(false);
          }}
          placeholder="Example: skincare products for dry skin"
          rows={3}
        />

        <div className="ai-budget-fields">
          <div>
            <label htmlFor="min-budget">
              Minimum budget (₹)
            </label>

            <input
              id="min-budget"
              type="number"
              min="0"
              value={minBudget}
              onChange={(event) => {
                setMinBudget(event.target.value);
                setShowAssistantResults(false);
              }}
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="max-budget">
              Maximum budget (₹)
            </label>

            <input
              id="max-budget"
              type="number"
              min="0"
              value={maxBudget}
              onChange={(event) => {
                setMaxBudget(event.target.value);
                setShowAssistantResults(false);
              }}
              placeholder="Any budget"
            />
          </div>
        </div>

        <button
          type="button"
          className="ai-recommend-button"
          disabled={
            loadingProducts ||
            (minBudget !== "" &&
              (!Number.isFinite(Number(minBudget)) ||
                Number(minBudget) < 0)) ||
            (maxBudget !== "" &&
              (!Number.isFinite(Number(maxBudget)) ||
                Number(maxBudget) < 0)) ||
            (minBudget !== "" &&
              maxBudget !== "" &&
              Number(minBudget) > Number(maxBudget))
          }
          onClick={findAssistantProducts}
        >
          Find Matching Products
          <span>→</span>
        </button>

        {showAssistantResults && (
          <div className="ai-assistant-results">
            <h3>Products selected for you</h3>

            {assistantProducts.length > 0 ? (
              <div className="ai-results-grid">
                {assistantProducts.map((product, index) => {
                  const id = getProductId(product);

                  const image =
                    product.image ||
                    product.imageUrl ||
                    product.thumbnail;

                  return (
                    <div
                      className="ai-product-card"
                      key={id || `${product.name}-${index}`}
                    >
                      <div className="ai-product-image">
                        {image ? (
                          <img
                            src={image}
                            alt={
                              product.name ||
                              product.title ||
                              "GreenCart product"
                            }
                          />
                        ) : (
                          <span>🌿</span>
                        )}
                      </div>

                      <div className="ai-product-info">
                        <span>
                          {getProductCategory(product)}
                        </span>

                        <h3>
                          {product.name || product.title}
                        </h3>

                        <p>
                          {product.description ||
                            "A product available from GreenCart."}
                        </p>

                        <div className="ai-product-bottom">
                          <strong>
                            ₹{Number(product.price).toFixed(2)}
                          </strong>

                          {id ? (
                            <Link to={`/product/${id}`}>
                              View Product →
                            </Link>
                          ) : (
                            <Link to="/shop">
                              View Shop →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ai-no-results">
                <span>🌿</span>

                <h3>No matching products found</h3>

                <p>
                  Try different keywords or adjust your budget.
                  Make sure matching products exist in your database.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
      {/* RESULTS */}
      
    </div>
  );
}

export default AIRecommendation;
