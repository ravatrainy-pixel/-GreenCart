
import { Link } from "react-router-dom";
import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import "../styles/ProductCard.css";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  // Support both MongoDB _id and frontend id.
  const productId = product.id || product._id;
  const liked = isInWishlist(productId);

  const stock = Number(product.stock ?? 0);
  console.log("Product:", product.name, "Stock:", product.stock);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleWishlist = () => {
    if (liked) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
        ...product,
        id: productId,
      });
    }
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      id: productId,
    });
  };

  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="product-image-wrapper">
        <Link to={`/product/${productId}`}>
          <img
            src={
              product.image ||
              "https://placehold.co/400x400?text=GreenCart"
            }
            alt={product.name || "GreenCart product"}
            className="product-image"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "https://placehold.co/400x400?text=GreenCart";
            }}
          />
        </Link>
        {/* Stock Status */}
        <span
          className={`stock-badge ${
            isOutOfStock
              ? "out-of-stock"
              : isLowStock
                ? "low-stock"
                : "in-stock"
          }`}
        >
          {isOutOfStock
            ? "Out of Stock"
            : isLowStock
              ? `Only ${stock} left`
              : "In Stock"}
        </span>
        {/* Wishlist */}
        <button
          type="button"
          className={`wishlist-button ${
            liked ? "wishlist-active" : ""
          }`}
          onClick={handleWishlist}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {/* Product Information */}
      <div className="product-info">
        <span className="product-category">
          {product.category || "Other"}
        </span>

        <Link
          to={`/product/${productId}`}
          className="product-name"
        >
          {product.name || "Unnamed Product"}
        </Link>

        <div className="product-bottom">
          <span className="product-price">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </span>

          <button
            type="button"
            className="shop-add-cart-button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "Out of Stock" : "🛒 Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
