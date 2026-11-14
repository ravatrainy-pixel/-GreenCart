import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import { getProducts } from "../api/productService";
import ProductCard from "./ProductCard";
import "../styles/Shop.css";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("greencartRecentlyViewed") || "[]"
    );
  } catch {
    return [];
  }
});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognitionRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const handleVoiceSearch = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceMessage(
          "Voice search is not supported in this browser. Try Google Chrome."
        );
        return;
      }

      // Stop listening if the microphone is already active
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceMessage("Listening... Speak a product name.");
      };

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;

        setSearchTerm(spokenText);
        setVoiceMessage(`Searching for "${spokenText}"`);
      };

      recognition.onerror = (event) => {
        setVoiceMessage(
          event.error === "not-allowed"
            ? "Microphone permission denied. Allow microphone access in your browser."
            : `Voice search error: ${event.error}`
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    };
  // Load categories from MongoDB through Flask
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await api.get("/categories");
        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.categories)
            ? data.categories
            : [];

        if (!cancelled) {
          setCategories(
            list
              .map((category) => category.name)
              .filter(Boolean)
          );
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load products from MongoDB through Flask
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (!cancelled) {
          const productList = Array.isArray(data)
            ? data
            : Array.isArray(data.products)
              ? data.products
              : [];

          const formattedProducts = productList.map((product) => ({
            ...product,
            id: product._id || product.id,
            name: product.name || "Unnamed Product",
            category: product.category || "Other",
            brand: product.brand || "",
            price: Number(product.price) || 0,
            rating: Number(product.rating) || 0,
            discount: Number(product.discount) || 0,
          }));

          setProducts(formattedProducts);
        }
      } catch (err) {
        console.error("Error loading GreenCart products:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please check that Flask and MongoDB are running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("greencartRecentlyViewed") || "[]"
        );

        setRecentlyViewed(Array.isArray(saved) ? saved : []);
      } catch {
        setRecentlyViewed([]);
      }
    };

    loadRecentlyViewed();
  }, []);
  // Keep selected category synchronized with the URL
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "All");
  }, [searchParams]);

  // Compare category names without case or whitespace differences
  const normalize = (value) =>
    String(value || "").trim().toLowerCase();

  // Filter products by category and search text
    const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      normalize(product.category) === normalize(selectedCategory);

    const search = normalize(searchTerm);

    const matchesSearch =
      normalize(product.name).includes(search) ||
      normalize(product.category).includes(search) ||
      normalize(product.brand).includes(search);

    const matchesMinPrice =
      minPrice === "" || product.price >= Number(minPrice);

    const matchesMaxPrice =
      maxPrice === "" || product.price <= Number(maxPrice);

    return (
      matchesCategory &&
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice
    );
    
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "discount":
        return b.discount - a.discount;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Update the category filter and URL
  const handleCategoryChange = (category) => {
    setSearchParams(
      category === "All" ? {} : { category }
    );
  };

  // Clear search and category filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({});
  };

  // Show the actual database categories plus All
  const availableCategories = [
    "All",
    ...categories.filter(
      (category) => normalize(category) !== "all"
    ),
  ];

  return (
    <section className="shop-section">
      <div className="shop-header">
        <div>
          <span className="shop-tag">
            🌿 EXPLORE GREENCART
          </span>

          <h1>
            Shop <span>Mindfully</span>
          </h1>

          <p>
            Discover organic, sustainable and everyday
            products selected for a greener lifestyle.
          </p>
        </div>
      </div>
      <div className="shop-toolbar">
      <div className="shop-search">
        <span>🔍</span>

        <input
          type="text"
          placeholder="Search products, brands, or categories..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setVoiceMessage("");
          }}
        />

        <button
          type="button"
          className={`voice-search-button ${isListening ? "listening" : ""}`}
          onClick={handleVoiceSearch}
          aria-label={isListening ? "Stop voice search" : "Start voice search"}
          title={isListening ? "Stop listening" : "Search by voice"}
        >
          {isListening ? "⏹️" : "🎤"}
        </button>
      </div>

      <div className="shop-sort">
        <label htmlFor="shop-sort-select">Sort by:</label>

        <select
          id="shop-sort-select"
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="rating">Top Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="discount">Biggest Discount</option>
          <option value="name">Name: A to Z</option>
        </select>
      </div>
    </div>

    {voiceMessage && (
      <p className="voice-search-message" role="status">
        {voiceMessage}
      </p>
    )}
      <div className="shop-price-filter">
        <label htmlFor="min-price">Min Price (₹)</label>
        <input
          id="min-price"
          type="number"
          min="0"
          placeholder="0"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
        />

        <label htmlFor="max-price">Max Price (₹)</label>
        <input
          id="max-price"
          type="number"
          min="0"
          placeholder="Any"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />
      </div>
      <div className="category-filter">
        {availableCategories.map((category) => (
          <button
            key={category}
            className={
              normalize(selectedCategory) === normalize(category)
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {loading && (
        <div className="no-products">
          <h3>Loading GreenCart products...</h3>
          <p>Please wait while we fetch products from the database.</p>
        </div>
      )}

      {!loading && error && (
        <div className="no-products">
          <h3>Unable to load products</h3>
          <p>{error}</p>

          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
        {recentlyViewed.length > 0 && (
  <section className="recently-viewed-section">
    <div className="recently-viewed-heading">
      <div>
        <span>YOUR BROWSING HISTORY</span>
        <h2>Recently Viewed</h2>
      </div>

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("greencartRecentlyViewed");
          setRecentlyViewed([]);
        }}
      >
        Clear History
      </button>
    </div>

    <div className="products-grid">
      {recentlyViewed.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  </section>
)}
          <div className="shop-result-info">
            <p>
              Showing <strong>{sortedProducts.length}</strong> products
            </p>

            {selectedCategory !== "All" && (
              <p>
                Category: <strong>{selectedCategory}</strong>
              </p>
            )}

            {searchTerm && (
              <p>
                Search results for <strong>"{searchTerm}"</strong>
              </p>
            )}
          </div>

          {sortedProducts.length > 0 ? (
            <div className="products-grid">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>

              <h3>No products found</h3>

              <p>
                {products.length === 0
                  ? "No products have been added to your database yet."
                  : "Try another search or choose a different category."}
              </p>

              <button onClick={handleClearFilters}>
                View All Products
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Shop;
