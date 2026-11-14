
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../api/productService";
import "../styles/AdminAddProduct.css";

function AdminAddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    status: "Active",
    expiryDate: "",
    estimatedUsageDays: "",
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Unable to load categories:", err);
        setError(
          "Unable to load categories. Please check the backend."
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    setError("");

    if (files.length === 0) return;

    if (
      files.some((file) => !file.type.startsWith("image/"))
    ) {
      setError("Please select only valid image files.");
      e.target.value = "";
      return;
    }

    if (
      files.some((file) => file.size > 2 * 1024 * 1024)
    ) {
      setError("Each image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    const readImage = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(String(reader.result || ""));
        };

        reader.onerror = () => {
          reject(new Error(`Unable to read ${file.name}`));
        };

        reader.readAsDataURL(file);
      });

    try {
      const selectedImages = await Promise.all(
        files.map(readImage)
      );

      setImages((previous) => [
        ...previous,
        ...selectedImages,
      ]);
    } catch (err) {
      setError(
        err.message || "Unable to read selected images."
      );
    }

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const makeMainImage = (index) => {
    setImages((previous) => {
      const updated = [...previous];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (saving) return;

    if (!form.name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    
    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Enter a valid price of zero or more.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Enter a valid whole-number stock quantity.");
      return;
    }
    
    const product = {
      name: form.name.trim(),
      category: form.category,
      price,
      stock,
      description: form.description.trim(),
      status: form.status,
      image: images[0] || "",
      images,
      expiryDate: form.expiryDate || null,
      estimatedUsageDays: form.estimatedUsageDays
        ? Number(form.estimatedUsageDays)
        : null,
    };

    try {
      setSaving(true);

      const data = await addProduct(product);

      if (data.success === false) {
        throw new Error(
          data.message || "Unable to save the product."
        );
      }

      alert("Product added successfully!");
      navigate("/admin/products");
    } catch (err) {
      console.error("Unable to save product:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to connect to the backend. Check that Flask is running."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-add-product">
      <div className="add-product-header">
        <div>
          <h1>Add Product</h1>
          <p>Add a new product to your GreenCart store.</p>
        </div>

        <button
          type="button"
          className="add-product-back"
          onClick={() => navigate("/admin/products")}
        >
          ← Back to Products
        </button>
      </div>

      <form className="add-product-form" onSubmit={handleSubmit}>
        <div className="add-product-section">
          <h2>Product Information</h2>

          <div className="add-product-grid">
            <div className="add-product-field">
              <label htmlFor="product-name">
                Product Name *
              </label>
              <input
                id="product-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="add-product-field">
              <label htmlFor="product-category">
                Category *
              </label>
              <select
                id="product-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={
                      category._id ||
                      category.id ||
                      category.name
                    }
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {!categoriesLoading &&
                categories.length === 0 && (
                  <small>
                    Add a category in Admin → Categories first.
                  </small>
                )}
            </div>

            <div className="add-product-field">
              <label htmlFor="product-price">Price (₹) *</label>
              <input
                id="product-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />
            </div>

            <div className="add-product-field">
              <label htmlFor="product-stock">
                Stock Quantity *
              </label>
              <input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="Enter quantity"
                required
              />
            </div>
            
            <div className="add-product-field">
              <label htmlFor="product-expiry">Expiry Date</label>
              <input
                id="product-expiry"
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
              />
            </div>

            <div className="add-product-field">
              <label htmlFor="estimated-usage">
                Estimated Usage (Days)
              </label>
              <input
                id="estimated-usage"
                name="estimatedUsageDays"
                type="number"
                min="1"
                step="1"
                value={form.estimatedUsageDays}
                onChange={handleChange}
                placeholder="Example: 30"
              />
            </div>

            <div className="add-product-field">
              <label htmlFor="product-status">Status</label>
              <select
                id="product-status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
    
          </div>

          <div className="add-product-field add-product-description">
            <label htmlFor="product-description">
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the product..."
              rows="4"
            />
          </div>
        </div>

        <div className="add-product-section">
          <h2>Product Images Gallery</h2>

          <div className="add-product-field">
            <label htmlFor="product-image">
              Select Multiple Images (maximum 2 MB each)
            </label>

            <input
              id="product-image"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />

            <small>
              The first image is the main product image.
            </small>
          </div>

          {images.length > 0 && (
            <div className="image-preview-gallery">
              {images.map((src, index) => (
                <div
                  className="image-preview-item"
                  key={`${index}-${src.slice(0, 30)}`}
                >
                  <img
                    src={src}
                    alt={`Product preview ${index + 1}`}
                  />

                  {index === 0 && (
                    <span>Main Image</span>
                  )}

                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeMainImage(index)}
                    >
                      Make Main
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="add-product-error" role="alert">
            {error}
          </p>
        )}

        <div className="add-product-actions">
          <button
            type="button"
            className="add-product-cancel"
            onClick={() => navigate("/admin/products")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="add-product-submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminAddProduct;
