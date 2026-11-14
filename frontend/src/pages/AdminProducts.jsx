
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../api/productService";
import "../styles/AdminProducts.css";

function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load products from MongoDB through Flask.
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const fetchedProducts = await getProducts();

      setProducts(
        fetchedProducts.map((product) => ({
          ...product,
          id: String(product.id ?? product._id ?? ""),
          name: product.name || "Unnamed Product",
          category: product.category || "Uncategorized",
          price: Number(product.price ?? 0),
          stock: Number(product.stock ?? 0),
          status: product.status || "Active",
        }))
      );
    } catch (err) {
      console.error("Unable to load products:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load products. Check that Flask and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Delete a product from MongoDB through Flask.
  const handleDelete = async (id) => {
    if (!id) {
      alert("This product does not have a valid ID.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await deleteProduct(id);

      if (response.success === false) {
        throw new Error(
          response.message || "Unable to delete product."
        );
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => String(product.id) !== String(id)
        )
      );

      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Unable to delete product:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete product. Please check the Flask DELETE endpoint."
      );
    }
  };

  // Filter by search, category, and status.
  const filteredProducts = products.filter((product) => {
    const productName = String(product.name || "");
    const productCategory = String(product.category || "");
    const productStatus = String(product.status || "Active");

    return (
      productName.toLowerCase().includes(search.toLowerCase()) &&
      (!category || productCategory === category) &&
      (!status || productStatus === status)
    );
  });

  return (
    <div className="admin-products">
      <div className="admin-products-header">
        <div>
          <h1>Products</h1>
          <p>Manage all products in your GreenCart store.</p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={() => navigate("/admin/products/add")}
        >
          + Add Product
        </button>
      </div>

      <div className="products-toolbar">
        <div className="product-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Skin Care">Skin Care</option>
          <option value="Hair Care">Hair Care</option>
          <option value="Home Essentials">Home Essentials</option>
        </select>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="products-count">
        {filteredProducts.length} product
        {filteredProducts.length !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <div className="products-empty">
          <p>{error}</p>
          <button type="button" onClick={loadProducts}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="products-empty">
                      <div className="products-empty-icon">📦</div>
                      <h3>
                        {products.length === 0
                          ? "No products yet"
                          : "No matching products"}
                      </h3>
                      <p>
                        {products.length === 0
                          ? "Add your first product to your store."
                          : "Try changing your search or filters."}
                      </p>

                      {products.length === 0 && (
                        <button
                          type="button"
                          className="empty-add-product-btn"
                          onClick={() =>
                            navigate("/admin/products/add")
                          }
                        >
                          + Add Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const id = product.id;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-product-info">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="admin-product-image"
                            />
                          ) : (
                            <div className="admin-product-image-placeholder">
                              📦
                            </div>
                          )}

                          <div>
                            <strong>{product.name}</strong>
                            <small>ID: {id || "Unavailable"}</small>
                          </div>
                        </div>
                      </td>

                      <td>{product.category}</td>

                      <td>
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>

                      <td>
                        <span
                          className={
                            product.stock === 0
                              ? "stock-out"
                              : product.stock <= 5
                              ? "stock-low"
                              : "stock-available"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            product.status === "Active"
                              ? "product-status-active"
                              : "product-status-inactive"
                          }
                        >
                          {product.status}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">
                          <button
                            type="button"
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                            onClick={() =>
                              navigate(`/admin/products/edit/${encodeURIComponent(id)}`)
                            }
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => handleDelete(id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
