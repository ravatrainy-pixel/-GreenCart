import ProductRating from "../components/ProductRating";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import {
  getProductById,
  getProducts,
} from "../api/productService";

import "../styles/ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();

  const { addToCart } = useCart();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setRelatedProducts([]);
        setQuantity(1);

        const data = await getProductById(id);
        console.log("URL product ID:", id);
        console.log("Product returned by API:", data);
        console.log("MongoDB _id:", data?._id);
        console.log("Product id:", data?.id);
        if (cancelled) return;

        const formattedProduct = {
          ...data,
          id: String(data._id ?? data.id),
          price: Number(data.price) || 0,
          stock: Number(data.stock) || 0,
        };

        setProduct(formattedProduct);
        // Save recently viewed products
        try {
          const savedProducts = JSON.parse(
            localStorage.getItem("greencartRecentlyViewed") || "[]"
          );

          const updatedProducts = [
            formattedProduct,
            ...savedProducts.filter(
              (item) => String(item.id) !== String(formattedProduct.id)
            ),
          ].slice(0, 8);

          localStorage.setItem(
            "greencartRecentlyViewed",
            JSON.stringify(updatedProducts)
          );
        } catch (error) {
          console.error("Unable to save recently viewed products:", error);
        }
        // Load related products separately.
        try {
          const allProducts = await getProducts();

          if (!cancelled) {
            const related = allProducts
              .map((item) => ({
                ...item,
                id: String(item._id ?? item.id),
                price: Number(item.price) || 0,
              }))
              .filter(
                (item) =>
                  item.id !== formattedProduct.id &&
                  item.category === formattedProduct.category
              )
              .slice(0, 4);

            setRelatedProducts(related);
          }
        } catch (relatedError) {
          console.error(
            "Unable to load related products:",
            relatedError
          );
        }
      } catch (err) {
        console.error("Product details error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load product details. Please check your backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadProduct();
    } else {
      setError("Product ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const liked = product
    ? isInWishlist(product.id)
    : false;

  const stock = product
    ? Number(product.stock ?? 0)
    : 0;

  
const productImages = product
  ? [
      ...new Set(
        [
          ...(Array.isArray(product.images) ? product.images : []),
          product.image,
          product.imageUrl,
        ].filter(
          (img) => typeof img === "string" && img.trim() !== ""
        )
      ),
    ]
  : [];

const image = selectedImage || productImages[0] || "";


  const increaseQuantity = () => {
    setQuantity((current) =>
      current < stock ? current + 1 : current
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );
  };

  
const handleAddToCart = () => {
  if (!product || stock < 1) return;

  for (let i = 0; i < quantity; i++) {
    addToCart(product);
  }
};


  const handleWishlist = () => {
    if (!product) return;

    if (liked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="product-not-found">
        <h2>Loading Product...</h2>
        <p>Please wait while we fetch product information.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-not-found">
        <h2>Unable to Load Product</h2>
        <p>{error}</p>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product Not Found</h2>
        <p>Sorry, we couldn't find this product.</p>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      {/* Main Product Section */}
      <section className="product-details-container">
        {/* Product Image */}
        <div className="product-details-image-section">
          <div className="product-details-image-box">
            {image ? (
              <img
                src={image}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "10px",
                  background: "#f3f7ef",
                  color: "#456b43",
                }}
              >
                <span style={{ fontSize: "70px" }}>🌿</span>
                <span>GreenCart Product</span>
              </div>
            )}

            <button
              type="button"
              className={`details-wishlist ${
                liked ? "active" : ""
              }`}
              onClick={handleWishlist}
              aria-label="Toggle wishlist"
            >
              {liked ? "♥" : "♡"}
            </button>
          </div>

          {productImages.length > 1 && (
            <div className="product-image-thumbnails">
              {productImages.map((img, index) => (
                <button
                  type="button"
                  key={`${index}-${img.slice(0, 30)}`}
                  className={`product-image-thumbnail ${
                    image === img ? "selected" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={image === img}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Product Information */}
        <div className="product-details-info">
          <span className="details-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>


          <div className="details-price">
            ₹{product.price.toLocaleString("en-IN")}
          </div>

          <p className="details-description">
            {product.description ||
              "A carefully selected organic and sustainable product from GreenCart."}
          </p>

          {/* Benefits */}
          <div className="details-benefits">
            <div className="benefit-item">
              <span>🌱</span>
              <div>
                <strong>Organic</strong>
                <small>Naturally sourced</small>
              </div>
            </div>

            <div className="benefit-item">
              <span>♻️</span>
              <div>
                <strong>Eco Friendly</strong>
                <small>Sustainable choice</small>
              </div>
            </div>

            <div className="benefit-item">
              <span>🚚</span>
              <div>
                <strong>Fast Delivery</strong>
                <small>Safe &amp; secure</small>
              </div>
            </div>
          </div>

          {/* Stock */}
          <p>
            {stock > 0
              ? `${stock} items available`
              : "Currently out of stock"}
          </p>

          {/* Quantity */}
          <div className="details-quantity-section">
            <span>Quantity</span>

            <div className="quantity-control">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="details-actions">
            <button
              type="button"
              className="details-cart-button"
              onClick={handleAddToCart}
              disabled={stock < 1}
            >
              {stock > 0
                ? "🛒 Add to Cart"
                : "Out of Stock"}
            </button>

            <button
              type="button"
              className={`details-save-button ${
                liked ? "saved" : ""
              }`}
              onClick={handleWishlist}
            >
              {liked ? "♥ Saved" : "♡ Save"}
            </button>
          </div>
        </div>
      </section>
      {/* Customer Rating */}
      <ProductRating productId={product.id} />

      {/* Product Description */}
      <section className="product-description-section">
        <div className="description-box">
          <h2>About this product</h2>
          <p>
            {product.description ||
              "GreenCart helps you discover products for more conscious shopping."}
          </p>
        </div>

        <div className="description-box">
          <h2>Why you'll love it</h2>
          <ul>
            <li>Thoughtfully selected product</li>
            <li>Useful for everyday needs</li>
            <li>Product details retrieved from the database</li>
            <li>A choice for conscious shoppers</li>
          </ul>
        </div>
      </section>

      {/* Related Products */}
      <section className="related-products-section">
        <div className="related-products-heading">
          <div>
            <span>YOU MAY ALSO LIKE</span>
            <h2>Related Products</h2>
          </div>

          <Link to="/shop">View All →</Link>
        </div>

        <div className="related-products-grid">
          {relatedProducts.map((item) => (
            <Link
              to={`/product/${item.id}`}
              className="related-product-card"
              key={item.id}
            >
              <div className="related-product-image">
                {item.image || item.imageUrl ? (
                  <img
                    src={item.image || item.imageUrl}
                    alt={item.name}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: "150px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f3f7ef",
                      fontSize: "42px",
                    }}
                  >
                    🌿
                  </div>
                )}
              </div>

              <div className="related-product-info">
                <span>{item.category}</span>
                <h3>{item.name}</h3>
                <strong>
                  ₹{item.price.toLocaleString("en-IN")}
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProductDetails;
