import { Link } from "react-router-dom";
import useWishlist from "../context/useWishlist";
import useCart from "../context/useCart";
import "../styles/Wishlist.css";

function Wishlist() {
  const {
    wishlistItems,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  return (
    <div className="wishlist-page">

      {/* Header */}
      <section className="wishlist-header">

        <div>
          <span className="wishlist-label">
            MY SAVED PRODUCTS
          </span>

          <h1>My Wishlist ❤️</h1>

          <p>
            Products you love and want to save for later.
          </p>
        </div>

        <div className="wishlist-count-box">
          <strong>{wishlistItems.length}</strong>
          <span>Saved Items</span>
        </div>

      </section>


      {/* Empty Wishlist */}
      {wishlistItems.length === 0 ? (

        <section className="wishlist-empty">

          <div className="empty-heart">
            ♡
          </div>

          <h2>Your Wishlist is Empty</h2>

          <p>
            Save products you love and come back to them
            whenever you're ready.
          </p>

          <Link
            to="/shop"
            className="wishlist-shop-button"
          >
            Explore Products
          </Link>

        </section>

      ) : (

        /* Wishlist Products */
        <section className="wishlist-products">

          {wishlistItems.map((product) => (

            <div
              className="wishlist-card"
              key={product.id}
            >

              {/* Image */}
              <Link
                to={`/product/${product.id}`}
                className="wishlist-image"
              >
                <div className="wishlist-product-images">
                {(Array.isArray(product.images) && product.images.length > 0
                  ? product.images
                  : [product.image]
                )
                  .filter((img) => typeof img === "string" && img.trim() !== "")
                  .map((img, index) => (
                    <img
                      key={`${index}-${img.slice(0, 30)}`}
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      className="wishlist-product-thumbnail"
                    />
                  ))}
              </div>
              </Link>


              {/* Details */}
              <div className="wishlist-details">

                <span className="wishlist-category">
                  {product.category}
                </span>

                <Link
                  to={`/product/${product.id}`}
                  className="wishlist-name"
                >
                  {product.name}
                </Link>

                <span className="wishlist-price">
                  ₹{product.price}
                </span>

                <div className="wishlist-actions">

                  <button
                    type="button"
                    className="wishlist-cart-button"
                    onClick={() =>
                      handleMoveToCart(product)
                    }
                  >
                    🛒 Add to Cart
                  </button>

                  <button
                    type="button"
                    className="wishlist-remove-button"
                    onClick={() =>
                      removeFromWishlist(product.id)
                    }
                  >
                    Remove
                  </button>

                </div>

              </div>

            </div>

          ))}

        </section>

      )}

    </div>
  );
}

export default Wishlist;