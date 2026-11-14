import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/AdminEditProduct.css";

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  status: "Active",
  image: "",
  images: [],
  expiryDate: "",
  estimatedUsageDays: "",
};

function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [productNotFound, setProductNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const data = response.data;

        if (isMounted) {
          setCategories(
            Array.isArray(data)
              ? data
              : Array.isArray(data.categories)
                ? data.categories
                : []
          );
        }
      } catch (err) {
        console.error("Unable to load categories:", err);

        if (isMounted) {
          setError(
            "Unable to load categories. Please check that the backend is running."
          );
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setProductNotFound(false);

      const response = await api.get("/products");
      const data = response.data;

      const products = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : [];

      const existingProduct = products.find(
        (item) => String(item.id ?? item._id ?? "") === String(id)
      );

      if (!existingProduct) {
        setProductNotFound(true);
        return;
      }

      // Support both older products with only "image"
      // and newer products with an "images" gallery.
      const existingImages = Array.isArray(existingProduct.images)
        ? existingProduct.images.filter(
            (item) => typeof item === "string" && item.length > 0
          )
        : [];

      const gallery =
        existingImages.length > 0
          ? existingImages
          : existingProduct.image
            ? [existingProduct.image]
            : [];

      setFormData({
        name: existingProduct.name || "",
        category: existingProduct.category || "",
        price: existingProduct.price ?? "",
        stock: existingProduct.stock ?? "",
        description: existingProduct.description || "",
        status: existingProduct.status || "Active",
        image: gallery[0] || existingProduct.image || "",
        images: gallery,
        expiryDate: existingProduct.expiryDate
          ? String(existingProduct.expiryDate).slice(0, 10)
          : "",
        estimatedUsageDays: existingProduct.estimatedUsageDays ?? "",
      });
    } catch (err) {
      console.error("Unable to load product:", err);

      setError(
        err.response?.data?.message ||
          "Could not load this product. Check that Flask and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    setError("");

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not a valid image file.`);
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError(`${file.name} exceeds the 2 MB file-size limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      const newImages = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = () => reject(
                new Error(`Unable to read ${file.name}.`)
              );

              reader.readAsDataURL(file);
            })
        )
      );

      setFormData((previous) => {
        const gallery = [...previous.images, ...newImages];

        return {
          ...previous,
          images: gallery,
          image: gallery[0] || "",
        };
      });
    } catch (err) {
      setError(err.message || "Unable to read the selected images.");
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((previous) => {
      const images = previous.images.filter(
        (_, index) => index !== indexToRemove
      );

      return {
        ...previous,
        images,
        image: images[0] || "",
      };
    });

    setError("");
  };

  const makeMainImage = (index) => {
    setFormData((previous) => {
      const images = [...previous.images];
      const [selectedImage] = images.splice(index, 1);
      images.unshift(selectedImage);

      return {
        ...previous,
        images,
        image: images[0] || "",
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (saving) return;

    if (categoriesLoading) {
      setError("Please wait while categories are loading.");
      return;
    }

    const name = formData.name.trim();
    const category = formData.category;
    const description = formData.description.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);
    if (!name || !category || !description) {
      setError("Please complete all required fields.");
      return;
    }

    if (!categories.some((item) => item.name === category)) {
      setError("Please select a valid category from Admin > Categories.");
      return;
    }

    if (
      formData.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Please enter a valid, non-negative price.");
      return;
    }

    if (
      formData.stock === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    const images = formData.images;
    const mainImage = images[0] || "";

    const updatedProduct = {
      name,
      category,
      price,
      stock,
      description,
      status: formData.status,
      image: mainImage,
      images,
      expiryDate: formData.expiryDate || null,
      estimatedUsageDays: formData.estimatedUsageDays
        ? Number(formData.estimatedUsageDays)
        : null,
    };

    try {
      setSaving(true);

      const token = localStorage.getItem("greencartAdminToken");

      if (!token) {
        setError("Admin session expired. Please log in again.");
        return;
      }

      const response = await api.put(
        `/products/${encodeURIComponent(id)}`,
        updatedProduct,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to update product."
        );
      }

      window.alert("Product updated successfully!");
      navigate("/admin/products");
    } catch (err) {
      console.error("Unable to update product:", err);

      if (err.response?.status === 401 || err.response?.status === 422) {
        setError(
          "Your admin session may have expired. Please log in again."
        );
      } else if (err.response?.status === 403) {
        setError("You do not have permission to update products.");
      } else if (err.response?.status === 404) {
        setError(
          "Product or update endpoint not found. Check the Flask PUT route."
        );
      } else if (err.response?.status === 405) {
        setError("The backend does not support PUT for products.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to save changes. Please check your backend."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-product-page">
        <p>Loading product...</p>
      </div>
    );
  }

  if (productNotFound) {
    return (
      <div className="edit-product-page">
        <div className="edit-product-header">
          <div>
            <h1>Product Not Found</h1>
            <p>The product may have been deleted or does not exist.</p>
          </div>
        </div>

        <button
          type="button"
          className="edit-product-back"
          onClick={() => navigate("/admin/products")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  if (error && !formData.name && !formData.category) {
    return (
      <div className="edit-product-page">
        <div className="edit-product-error" role="alert">
          {error}
        </div>

        <button
          type="button"
          className="edit-product-back"
          onClick={loadProduct}
        >
          Try Again
        </button>

        <button
          type="button"
          className="edit-product-cancel"
          onClick={() => navigate("/admin/products")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <div className="edit-product-header">
        <div>
          <h1>Edit Product</h1>
          <p>Update product information in your GreenCart store.</p>
        </div>

        <button
          type="button"
          className="edit-product-back"
          onClick={() => navigate("/admin/products")}
        >
          Back to Products
        </button>
      </div>

      <form className="edit-product-form" onSubmit={handleSubmit}>
        {error && (
          <div className="edit-product-error" role="alert">
            {error}
          </div>
        )}

        <section className="edit-product-section">
          <h2>Basic Information</h2>

          <div className="edit-product-grid">
            <div className="edit-product-field">
              <label htmlFor="name">
                Product Name <span>*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="edit-product-field">
              <label htmlFor="category">
                Category <span>*</span>
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {categories.map((item) => (
                  <option
                    key={item._id || item.id || item.name}
                    value={item.name}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              {!categoriesLoading && categories.length === 0 && (
                <small>
                  No categories found. Add one under Admin &gt; Categories.
                </small>
              )}
            </div>

            <div className="edit-product-field">
              <label htmlFor="price">
                Price (₹) <span>*</span>
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />
            </div>

            <div className="edit-product-field">
              <label htmlFor="stock">
                Stock Quantity <span>*</span>
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                placeholder="Enter stock quantity"
                required
              />
            </div>
            
            <div className="edit-product-field">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </div>

          <div className="edit-product-field">
            <label htmlFor="estimatedUsageDays">
              Estimated Usage (Days)
            </label>
            <input
              id="estimatedUsageDays"
              name="estimatedUsageDays"
              type="number"
              min="1"
              step="1"
              value={formData.estimatedUsageDays}
              onChange={handleChange}
              placeholder="Example: 30"
            />
          </div>

            <div className="edit-product-field edit-product-full-width">
              <label htmlFor="description">
                Product Description <span>*</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the product, its benefits and ingredients..."
                rows="5"
                required
              />
            </div>
            
          </div>
        </section>

        <section className="edit-product-section">
          <h2>Product Images</h2>

          <div className="edit-product-field">
            <label htmlFor="images">Upload Images</label>

            <div className="edit-product-image-upload">
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />

              <small>
                Select one or more images. Each image must be 2 MB or less.
                The first image is the main product image.
              </small>
            </div>

            {formData.images.length > 0 ? (
              <div className="edit-product-gallery">
                {formData.images.map((image, index) => (
                  <div className="edit-product-gallery-item" key={`${index}-${image.slice(0, 40)}`}>
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                    />

                    {index === 0 && (
                      <span className="edit-product-main-badge">
                        Main Image
                      </span>
                    )}

                    <div className="edit-product-gallery-actions">
                      {index !== 0 && (
                        <button
                          type="button"
                          className="edit-product-make-main"
                          onClick={() => makeMainImage(index)}
                          disabled={saving}
                        >
                          Make Main
                        </button>
                      )}

                      <button
                        type="button"
                        className="edit-product-remove-image"
                        onClick={() => removeImage(index)}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="edit-product-no-images">
                No images selected. Upload images to add a product gallery.
              </p>
            )}
          </div>
        </section>

        <section className="edit-product-section">
          <h2>Product Availability</h2>

          <div className="edit-product-status">
            <label>Product Status</label>

            <div className="edit-product-status-options">
              <label>
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={handleChange}
                />
                Active
              </label>

              <label>
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={handleChange}
                />
                Inactive
              </label>
            </div>

            <small>
              Active products can be displayed in your store,
              depending on your customer-side product filtering.
            </small>
          </div>
        </section>

        <div className="edit-product-actions">
          <button
            type="button"
            className="edit-product-cancel"
            onClick={() => navigate("/admin/products")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="edit-product-submit"
            disabled={saving || categoriesLoading}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditProduct;