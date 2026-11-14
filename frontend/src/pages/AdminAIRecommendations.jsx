
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/AdminAIRecommendations.css";

const API_URL = "http://127.0.0.1:5000/api";

function AdminAIRecommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Fetch real products from Flask and MongoDB
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/products`);

      const fetchedProducts = response.data.products || [];

      setProducts(
        fetchedProducts.map((product) => ({
          ...product,
          // Support either MongoDB serialization format.
          id: product.id ?? product._id,
        }))
      );
    } catch (err) {
      console.error("Error fetching products:", err);

      setError(
        "Unable to load products. Please check that your Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get product categories for the filter
  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        products.map((product) => product.category).filter(Boolean)
      ),
    ],
    [products]
  );

  // Generate rule-based recommendations from real product data
  const recommendations = useMemo(() => {
    const results = [];

    products.forEach((product) => {
      const stock = Number(product.stock) || 0;
      const price = Number(product.price) || 0;
      const name = product.name || "Unnamed product";
      const category = product.category || "Uncategorized";
      const productId = product.id ?? product._id;

      if (product.status === "Inactive") {
        results.push({
          id: `${productId}-inactive`,
          productId,
          name,
          category,
          type: "Visibility",
          priority: "Medium",
          icon: "👁️",
          title: "Review product visibility",
          message:
            "This product is inactive. Check its details and availability before making it visible to customers.",
          action: "Review product",
        });
      }

      if (stock === 0) {
        results.push({
          id: `${productId}-out`,
          productId,
          name,
          category,
          type: "Inventory",
          priority: "High",
          icon: "🚨",
          title: "Product out of stock",
          message:
            "Update inventory after checking available supply. Customers may be unable to purchase this item.",
          action: "Restock product",
        });
      } else if (stock > 0 && stock <= 5) {
        results.push({
          id: `${productId}-low`,
          productId,
          name,
          category,
          type: "Inventory",
          priority: "High",
          icon: "📦",
          title: "Low stock detected",
          message: `Only ${stock} unit${
            stock === 1 ? "" : "s"
          } remain. Review sales and supplier availability before restocking.`,
          action: "Review stock",
        });
      }

      if (price === 0) {
        results.push({
          id: `${productId}-price`,
          productId,
          name,
          category,
          type: "Pricing",
          priority: "Medium",
          icon: "💰",
          title: "Review product pricing",
          message:
            "The product price is zero. Verify that the price is intentional before publishing or selling it.",
          action: "Review price",
        });
      }
    });

    // Check category coverage among active products
    const activeProducts = products.filter(
      (product) => product.status !== "Inactive"
    );

    const categoryCounts = activeProducts.reduce((counts, product) => {
      const category = product.category || "Uncategorized";

      counts[category] = (counts[category] || 0) + 1;

      return counts;
    }, {});

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count < 2) {
        results.push({
          id: `category-${category}`,
          productId: null,
          name: category,
          category,
          type: "Catalog",
          priority: "Low",
          icon: "🌱",
          title: "Explore category expansion",
          message:
            "This category has fewer than two active products. Consider researching customer demand before adding more products.",
          action: "Review category",
        });
      }
    });

    return results;
  }, [products]);

  // Search and filters
  const filteredRecommendations = recommendations.filter((item) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(searchText) ||
      item.title.toLowerCase().includes(searchText) ||
      item.category.toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    const matchesPriority =
      priorityFilter === "All" || item.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Dashboard statistics
  const highPriority = recommendations.filter(
    (item) => item.priority === "High"
  ).length;

  const inventoryIssues = recommendations.filter(
    (item) => item.type === "Inventory"
  ).length;

  // Navigate to the relevant admin page
  const handleAction = (item) => {
    if (item.productId !== null && item.productId !== undefined) {
      window.location.href = `/admin/products/edit/${encodeURIComponent(
        item.productId
      )}`;
      return;
    }

    window.location.href = "/admin/categories";
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-ai-page">
        <div className="admin-ai-empty">
          <h2>Loading product insights...</h2>
          <p>Fetching the latest products from GreenCart.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-ai-page">
        <div className="admin-ai-empty">
          <div className="admin-ai-empty-icon">⚠️</div>
          <h2>Unable to load recommendations</h2>
          <p>{error}</p>

          <button
            type="button"
            className="admin-ai-action-button"
            onClick={fetchProducts}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-ai-page">
      <header className="admin-ai-header">
        <div>
          <span className="admin-ai-eyebrow">
            GREENCART INTELLIGENCE
          </span>

          <h1>AI Recommendations</h1>

          <p>
            Review product, inventory, and catalog insights for your store.
          </p>
        </div>

        
      </header>

      

      <section className="admin-ai-stats">
        <article className="admin-ai-stat-card">
          <div className="admin-ai-stat-icon">📊</div>

          <div>
            <span>Total recommendations</span>
            <strong>{recommendations.length}</strong>
          </div>
        </article>

        <article className="admin-ai-stat-card">
          <div className="admin-ai-stat-icon admin-ai-icon-red">
            ⚠️
          </div>

          <div>
            <span>High priority</span>
            <strong>{highPriority}</strong>
          </div>
        </article>

        <article className="admin-ai-stat-card">
          <div className="admin-ai-stat-icon admin-ai-icon-orange">
            📦
          </div>

          <div>
            <span>Inventory issues</span>
            <strong>{inventoryIssues}</strong>
          </div>
        </article>

        <article className="admin-ai-stat-card">
          <div className="admin-ai-stat-icon admin-ai-icon-green">
            🛍️
          </div>

          <div>
            <span>Products analyzed</span>
            <strong>{products.length}</strong>
          </div>
        </article>
      </section>

      <section className="admin-ai-panel">
        <div className="admin-ai-panel-header">
          <div>
            <h2>Store insights</h2>
            <p>
              Suggestions based on your current product catalog.
            </p>
          </div>

          <button
            type="button"
            className="admin-ai-action-button"
            onClick={fetchProducts}
          >
            Refresh data ↻
          </button>
        </div>

        <div className="admin-ai-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recommendations..."
            aria-label="Search recommendations"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>
        </div>

        {filteredRecommendations.length > 0 ? (
          <div className="admin-ai-recommendation-list">
            {filteredRecommendations.map((item) => (
              <article
                className="admin-ai-recommendation"
                key={item.id}
              >
                <div className="admin-ai-recommendation-icon">
                  {item.icon}
                </div>

                <div className="admin-ai-recommendation-content">
                  <div className="admin-ai-recommendation-top">
                    <span className="admin-ai-type">
                      {item.type}
                    </span>

                    <span
                      className={`admin-ai-priority admin-ai-priority-${item.priority.toLowerCase()}`}
                    >
                      {item.priority} priority
                    </span>
                  </div>

                  <h3>{item.title}</h3>

                  <p className="admin-ai-product-name">
                    {item.name}
                  </p>

                  <p className="admin-ai-message">
                    {item.message}
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-ai-action-button"
                  onClick={() => handleAction(item)}
                >
                  {item.action}
                  <span aria-hidden="true"> →</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-ai-empty">
            <div className="admin-ai-empty-icon">🌿</div>

            <h3>No recommendations found</h3>

            <p>
              {products.length === 0
                ? "No products were returned by the database. Add products to your GreenCart catalog to start receiving basic store insights."
                : "Try changing your search or filters. No matching issues were found."}
            </p>
          </div>
        )}
      </section>

      <footer className="admin-ai-footer">
        <span>GreenCart Admin</span>

        <span>
          {recommendations.length} suggestion
          {recommendations.length === 1 ? "" : "s"} generated from
          current product data
        </span>
      </footer>
    </div>
  );
}

export default AdminAIRecommendations;
