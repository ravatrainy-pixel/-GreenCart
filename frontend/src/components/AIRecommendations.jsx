
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getProducts } from "../api/productService";
import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import "../styles/AIRecommendations.css";

function AIRecommendations() {
  const { addToCart } = useCart();
  const { addToWishlist, wishlistItems = [] } = useWishlist();

  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const [category, setCategory] = useState("");
  const [need, setNeed] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Normalize text so capitalization and spacing do not affect matching.
  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const normalizeCategory = (value) =>
    normalize(value).replace(/\s+/g, "");

  // Load categories from the backend.
  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await api.get("/categories");
        const data = response.data;

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data?.data?.categories)
              ? data.data.categories
              : [];

        if (!active) return;

        const formattedCategories = categoryList
          .filter((item) => item && (item.name || item.title))
          .map((item) => {
            const name = String(item.name ?? item.title).trim();
            const normalized = normalizeCategory(name);

            let icon = "🛍️";

            switch (normalized) {
              case "clothing":
                icon = "👕";
                break;
              case "haircare":
                icon = "💆‍♀️";
                break;
              case "homeessentials":
                icon = "🏡";
                break;
              case "organicsnacks":
                icon = "🌿";
                break;
              case "skincare":
                icon = "✨";
                break;
              default:
                icon = "🛍️";
            }

            return {
              value: name,
              title: name,
              icon,
              description:
                item.description || "Explore our products",
            };
          });

        setCategoryOptions(formattedCategories);

        setCategory((current) =>
          formattedCategories.some(
            (item) =>
              normalizeCategory(item.value) ===
              normalizeCategory(current)
          )
            ? current
            : ""
        );

        setNeed("");
        setShowResults(false);
      } catch (err) {
        console.error("Failed to load categories:", err);

        if (active) {
          setCategoriesError(
            "Unable to load categories. Please check your backend."
          );
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  // Load products from the existing product API.
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts();
        const data = response?.data ?? response;

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data?.products)
              ? data.data.products
              : Array.isArray(data?.data)
                ? data.data
                : [];

        if (!active) return;

        const formattedProducts = productList.map((product) => ({
          ...product,
          id: product.id ?? product._id,
          name: product.name ?? product.title ?? "Unnamed Product",
          category: product.category ?? "",
          price: Number(product.price ?? 0),
          rating: Number(product.rating ?? 0),
          reviews: Number(
            product.reviews ?? product.reviewCount ?? 0
          ),
          discount: Number(product.discount ?? 0),
          image:
            product.image ??
            product.imageUrl ??
            product.images?.[0] ??
            "",
        }));

        setProducts(formattedProducts);
      } catch (err) {
        console.error("Failed to load products:", err);

        if (active) {
          setError(
            "Unable to load products. Please check that your backend is running."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  // Suggested needs for each category.
  const needOptions = {
    Clothing: [
      "Comfortable Everyday Wear",
      "Natural Fabrics",
      "Sustainable Fashion",
      "Affordable Clothing",
    ],

    "Hair care": [
      "Hair Growth",
      "Dry & Frizzy Hair",
      "Dandruff",
      "Hair Nourishment",
      "Daily Hair Care",
    ],

    "Home Essentials": [
      "Home Cleaning",
      "Kitchen",
      "Plastic Reduction",
      "Reusable Products",
      "Eco-Friendly Home",
    ],

    "Organic Snacks": [
      "Healthy Snacks",
      "Organic Food",
      "Low-Sugar Snacks",
      "Everyday Munching",
    ],

    "Skin Care": [
      "Hydration",
      "Face Cleansing",
      "Skin Nourishment",
      "Natural Skin Care",
      "Daily Skin Care",
    ],
  };

  // Find category needs without relying on exact capitalization.
  const selectedNeedOptions =
    Object.entries(needOptions).find(
      ([key]) =>
        normalizeCategory(key) === normalizeCategory(category)
    )?.[1] ?? ["Everyday Use", "Natural Products"];

  const getRecommendations = () => {
    if (!category || !need) return;
    setShowResults(true);
  };

  const getRecommendedProducts = () => {
    if (!category || !need) return [];

    // Match the selected category to the product's category.
    const categoryProducts = products.filter(
      (product) =>
        normalizeCategory(product.category) ===
        normalizeCategory(category)
    );

    const searchWords = normalize(need)
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const matchingRules = [
      {
        needs: ["hair growth"],
        words: ["growth", "strengthening", "hair fall"],
      },
      {
        needs: ["dry and frizzy hair"],
        words: ["dry", "frizzy", "smooth", "soft", "moistur"],
      },
      {
        needs: ["dandruff"],
        words: ["dandruff", "scalp", "neem"],
      },
      {
        needs: ["hair nourishment"],
        words: ["nourish", "nourishment", "botanical", "oil"],
      },
      {
        needs: ["hydration"],
        words: ["hydrating", "hydration", "aloe", "moistur"],
      },
      {
        needs: ["face cleansing"],
        words: ["cleanser", "cleansing", "face wash"],
      },
      {
        needs: ["reusable products"],
        words: ["reusable", "reuse", "refill"],
      },
      {
        needs: ["plastic reduction"],
        words: ["plastic", "waste", "reusable"],
      },
      {
        needs: ["natural fabrics"],
        words: ["cotton", "linen", "fabric", "natural"],
      },
      {
        needs: ["sustainable fashion"],
        words: ["sustainable", "recycled", "organic cotton"],
      },
      {
        needs: ["healthy snacks", "organic food", "low sugar snacks"],
        words: ["organic", "healthy", "natural", "sugar free", "low sugar"],
      },
      {
        needs: ["home cleaning", "eco friendly home"],
        words: ["cleaning", "natural", "eco friendly", "biodegradable"],
      },
      {
        needs: ["kitchen"],
        words: ["kitchen", "storage", "utensil"],
      },
    ];

    const scoredProducts = categoryProducts.map((product) => {
      const benefits = Array.isArray(product.benefits)
        ? product.benefits.join(" ")
        : product.benefits ?? "";

      const tags = Array.isArray(product.tags)
        ? product.tags.join(" ")
        : product.tags ?? "";

      const productText = normalize(
        [
          product.name,
          product.subCategory,
          product.subcategory,
          product.description,
          benefits,
          tags,
          product.brand,
        ].join(" ")
      );

      let score = 0;

      searchWords.forEach((word) => {
        if (productText.includes(word)) score += 2;
      });

      matchingRules.forEach((rule) => {
        const needMatches = rule.needs.some(
          (ruleNeed) => normalize(ruleNeed) === normalize(need)
        );

        if (
          needMatches &&
          rule.words.some((word) =>
            productText.includes(normalize(word))
          )
        ) {
          score += 5;
        }
      });

      // Prefer products explicitly tagged for the selected need.
      if (
        normalize(product.subCategory) === normalize(need) ||
        normalize(product.subcategory) === normalize(need)
      ) {
        score += 8;
      }

      return {
        ...product,
        recommendationScore: score,
      };
    });

    scoredProducts.sort(
      (a, b) =>
        b.recommendationScore - a.recommendationScore ||
        b.rating - a.rating
    );

    const matchingProducts = scoredProducts.filter(
      (product) => product.recommendationScore > 0
    );

    // If no need-specific match exists, still show products
    // from the selected category.
    const results =
      matchingProducts.length > 0
        ? matchingProducts
        : scoredProducts;

    return results.slice(0, 4);
  };

  const recommendedProducts = getRecommendedProducts();

  const handleCategoryChange = (value) => {
    setCategory(value);
    setNeed("");
    setShowResults(false);
  };

  const isWishlisted = (product) => {
    const productId = String(product.id ?? product._id ?? "");

    return wishlistItems.some(
      (item) =>
        String(item.id ?? item._id ?? item.productId ?? "") ===
        productId
    );
  };

  const handleWishlist = (product) => {
    if (!isWishlisted(product)) {
      addToWishlist(product);
    }
  };

  return (
    <section
      className="ai-recommendations"
      id="ai-recommendations"
    >
      <div className="ai-header">
        <span className="ai-label">🤖 GREENCART AI</span>

        <h2>
          Find Products <span>Made For You</span>
        </h2>

        <p>
          Tell us what you need and GreenCart will recommend
          suitable products from our collection.
        </p>
      </div>

      {(loading || categoriesLoading) && (
        <div className="ai-no-results">
          <p>Loading categories and products...</p>
        </div>
      )}

      {error && (
        <div className="ai-no-results" role="alert">
          <p>{error}</p>
        </div>
      )}

      {categoriesError && (
        <div className="ai-no-results" role="alert">
          <p>{categoriesError}</p>
        </div>
      )}

      {!loading &&
        !categoriesLoading &&
        !error &&
        !categoriesError && (
          <>
            <div className="ai-box">
              <div className="ai-step">
                <div className="ai-step-heading">
                  <span className="ai-step-number">01</span>

                  <div>
                    <h3>What are you looking for?</h3>
                    <p>Choose a product category.</p>
                  </div>
                </div>

                <div className="ai-category-grid">
                  {categoryOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={
                        normalizeCategory(category) ===
                        normalizeCategory(option.value)
                          ? "ai-category-card active"
                          : "ai-category-card"
                      }
                      onClick={() =>
                        handleCategoryChange(option.value)
                      }
                    >
                      <span className="ai-option-icon">
                        {option.icon}
                      </span>

                      <span className="ai-option-content">
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </span>

                      {normalizeCategory(category) ===
                        normalizeCategory(option.value) && (
                        <span className="ai-selected">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {categoryOptions.length === 0 && (
                  <p>No categories are available in MongoDB yet.</p>
                )}
              </div>

              {category && (
                <div className="ai-step">
                  <div className="ai-step-heading">
                    <span className="ai-step-number">02</span>

                    <div>
                      <h3>What is your main need?</h3>
                      <p>
                        Select the option that describes what
                        you&apos;re looking for.
                      </p>
                    </div>
                  </div>

                  <div className="ai-need-grid">
                    {selectedNeedOptions.map((option) => (
                      <button
                        type="button"
                        key={option}
                        className={
                          need === option
                            ? "ai-need-button active"
                            : "ai-need-button"
                        }
                        onClick={() => {
                          setNeed(option);
                          setShowResults(false);
                        }}
                      >
                        {option}
                        {need === option && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="ai-action">
                <button
                  type="button"
                  className="ai-recommend-button"
                  disabled={!category || !need}
                  onClick={getRecommendations}
                >
                  🤖 Get My Recommendations
                  <span>→</span>
                </button>
              </div>
            </div>

            {showResults && (
              <div className="ai-results">
                <div className="ai-results-header">
                  <div>
                    <span>✨ YOUR PERSONALIZED PICKS</span>
                    <h2>Recommended For You</h2>
                    <p>
                      Based on your {category} need:{" "}
                      <strong>{need}</strong>
                    </p>
                  </div>
                </div>

                {recommendedProducts.length > 0 ? (
                  <div className="ai-products-grid">
                    {recommendedProducts.map((product) => {
                      const productId = product.id ?? product._id;
                      const saved = isWishlisted(product);

                      return (
                        <div
                          className="ai-product-card"
                          key={productId ?? product.name}
                        >
                          <Link
                            to={
                              productId
                                ? `/product/${productId}`
                                : "/shop"
                            }
                            className="ai-product-image"
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                              />
                            ) : (
                              <span className="ai-option-icon">
                                🌿
                              </span>
                            )}

                            {product.discount > 0 && (
                              <span className="ai-discount">
                                -{product.discount}%
                              </span>
                            )}
                          </Link>

                          <div className="ai-product-details">
                            <span className="ai-product-category">
                              {product.category}
                            </span>

                            <Link
                              to={
                                productId
                                  ? `/product/${productId}`
                                  : "/shop"
                              }
                              className="ai-product-name"
                            >
                              {product.name}
                            </Link>

                            <p className="ai-product-description">
                              {product.description}
                            </p>

                            <div className="ai-product-rating">
                              <span>
                                ⭐{" "}
                                {product.rating > 0
                                  ? product.rating
                                  : "New"}
                              </span>

                              {product.reviews > 0 && (
                                <small>({product.reviews})</small>
                              )}
                            </div>

                            <div className="ai-product-bottom">
                              <strong>
                                ₹
                                {product.price.toLocaleString("en-IN")}
                              </strong>

                              {product.oldPrice != null &&
                                Number(product.oldPrice) >
                                  product.price && (
                                  <del>
                                    ₹
                                    {Number(
                                      product.oldPrice
                                    ).toLocaleString("en-IN")}
                                  </del>
                                )}
                            </div>

                            <div className="ai-product-actions">
                              <button
                                type="button"
                                className="ai-cart-button"
                                onClick={() => addToCart(product)}
                              >
                                🛒 Add to Cart
                              </button>

                              <button
                                type="button"
                                className={
                                  saved
                                    ? "ai-wishlist-button saved"
                                    : "ai-wishlist-button"
                                }
                                onClick={() =>
                                  handleWishlist(product)
                                }
                                title={
                                  saved
                                    ? "Already in wishlist"
                                    : "Add to wishlist"
                                }
                                aria-label={
                                  saved
                                    ? "Already in wishlist"
                                    : "Add to wishlist"
                                }
                              >
                                {saved ? "♥" : "♡"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ai-no-results">
                    <span>🌿</span>
                    <h3>No products found in this category</h3>
                    <p>
                      There are currently no products matching
                      this category. Try another category or add
                      products through the admin dashboard.
                    </p>
                    <Link to="/shop">Browse All Products</Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
    </section>
  );
}

export default AIRecommendations;
