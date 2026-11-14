
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import "../styles/Products.css";

function Products() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://127.0.0.1:5000/api/products"
        );

        const data = response.data.products || [];

        const activeProducts = data
          .filter(
            (product) =>
              (product.status || "Active") === "Active"
          )
          .map((product) => ({
            ...product,
            id: String(product.id ?? product._id),
            image: product.image || "",
            rating: product.rating ?? 0,
            reviews: product.reviews ?? 0,
            discount: product.discount ?? 0,
            oldPrice: product.oldPrice ?? null,
          }));

        setProducts(activeProducts);
      } catch (err) {
        console.error("Failed to fetch homepage products:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const featuredProducts = products.slice(0, 4);

  const isInWishlist = (productId) =>
    wishlistItems.some(
      (item) => String(item.id) === String(productId)
    );

  const handleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <section className="products-section" id="shop">
      <div className="products-header">
        <div>
          <p className="products-tag">OUR POPULAR PICKS</p>

          <h2>
            Featured <span>Products</span>
          </h2>

          <p className="products-description">
            Explore some of our most loved organic and
            sustainable products selected for everyday living.
          </p>
        </div>

        <button
          className="products-view-button"
          onClick={() => navigate("/shop")}
        >
          View All Products →
        </button>
      </div>

      {loading && (
        <p>Loading products...</p>
      )}

      {!loading && error && (
        <p role="alert">{error}</p>
      )}

      {!loading && !error && featuredProducts.length === 0 && (
        <p>No active products are available right now.</p>
      )}

      {!loading && !error && featuredProducts.length > 0 && (
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <div className="product-card" key={product.id}>
              <div className="product-image-container">
                {product.discount > 0 && (
                  <span className="discount-badge">
                    {product.discount}% OFF
                  </span>
                )}

                <button
                  type="button"
                  className={
                    isInWishlist(product.id)
                      ? "product-wishlist active"
                      : "product-wishlist"
                  }
                  title={
                    isInWishlist(product.id)
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"
                  }
                  onClick={() => handleWishlist(product)}
                >
                  {isInWishlist(product.id) ? "♥" : "♡"}
                </button>

                <Link
                  to={`/product/${product.id}`}
                  className="product-image"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />
                </Link>
              </div>

              <div className="product-info">
                <span className="product-category">
                  {product.category}
                </span>

                <Link
                  to={`/product/${product.id}`}
                  className="product-name-link"
                >
                  <h3>{product.name}</h3>
                </Link>

                <p className="product-description">
                  {product.description}
                </p>

                <div className="product-rating">
                  <span className="stars">★</span>
                  <strong>{product.rating}</strong>
                  <span className="review-count">
                    ({product.reviews})
                  </span>
                </div>

                <div className="product-bottom">
                  <div className="product-price">
                    <strong>₹{product.price}</strong>

                    {product.oldPrice && (
                      <del>₹{product.oldPrice}</del>
                    )}
                  </div>

                  <button
                    type="button"
                    className="add-cart-button"
                    onClick={() => addToCart(product)}
                    disabled={Number(product.stock ?? 0) <= 0}
                  >
                    {Number(product.stock ?? 0) <= 0
                      ? "Out of Stock"
                      : "+ Add"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Products;
