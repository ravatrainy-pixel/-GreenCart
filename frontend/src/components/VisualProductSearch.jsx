import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../styles/VisualProductSearch.css";

function VisualProductSearch() {
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedImage(null);
    setPreviewUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  
const handleSearch = async () => {
  if (!selectedImage) {
    setError("Please upload an image first.");
    return;
  }

  setError("");
  setResults([]);
  setSearching(true);

  try {
    const formData = new FormData();
    formData.append("image", selectedImage);

    const response = await axios.post(
      "http://127.0.0.1:5000/api/products/visual-search",
      formData
    );

    setResults(response.data.matches || []);
    setError(response.data.message || "");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to process the image. Please try again."
    );
  } finally {
    setSearching(false);
  }
};


  return (
    <section className="visual-search">
      <div className="visual-search-heading">
        <span className="visual-search-tag">SMART SHOPPING</span>
        <h2>Find Products by Image</h2>
        <p>
          Upload a product photo to discover similar products in GreenCart.
        </p>
      </div>

      <div className="visual-search-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageChange}
        />

        {previewUrl ? (
          <div className="visual-search-preview">
            <img src={previewUrl} alt="Selected product preview" />
            <button
              type="button"
              className="visual-search-remove"
              onClick={handleRemoveImage}
            >
              Remove image
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="visual-search-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="visual-search-icon">↑</span>
            <strong>Upload a product image</strong>
            <span>Choose JPG, PNG, or another image format</span>
            <small>Maximum file size: 5 MB</small>
          </button>
        )}

        {error && (
          <p className="visual-search-message" role="status">
            {error}
          </p>
        )}

        {selectedImage && (
        <button
            type="button"
            className="visual-search-submit"
            onClick={handleSearch}
            disabled={searching}
        >
            {searching ? "Processing Image..." : "Find Similar Products"}
        </button>
        )}
      </div>
      {results.length > 0 && (
  <div className="visual-search-results">
    <h3>Similar Products</h3>

    <div className="visual-search-results-grid">
      {results.map((product) => (
        <div className="visual-search-product" key={product._id || product.id}>
          <img
            src={product.image}
            alt={product.name}
          />
          <h4>{product.name}</h4>
          <p>₹{product.price}</p>
        </div>
      ))}
    </div>
  </div>
)}
    </section>
  );
}

export default VisualProductSearch;
