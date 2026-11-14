
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/AdminCategories.css";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getCategoryId = (category) =>
    category._id ?? category.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, productResponse] = await Promise.all([
        api.get("/categories"),
        api.get("/products"),
      ]);

      setCategories(categoryResponse.data.categories || []);
      setProducts(productResponse.data.products || []);
    } catch (err) {
      console.error("Unable to load categories:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load categories. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedName.toLowerCase() &&
        String(getCategoryId(category)) !== String(editingId)
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
      };

      if (editingId !== null) {
        await api.put(`/categories/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("greencartAdminToken")}`,
          },
        });
      } else {
        await api.post("/categories", payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("greencartAdminToken")}`,
          },
        });
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Unable to save category:", err);
      setError(
        err.response?.data?.message ||
        "Unable to save category. Please check your admin login."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(getCategoryId(category));
    setName(category.name);
    setDescription(category.description || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (category) => {
    const id = getCategoryId(category);

    const isUsed = products.some(
      (product) => product.category === category.name
    );

    if (isUsed) {
      alert(
        "This category is assigned to products. Update those products before deleting it."
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    setError("");

    try {
      await api.delete(`/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("greencartAdminToken")}`,
        },
      });

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error("Unable to delete category:", err);
      setError(
        err.response?.data?.message ||
        "Unable to delete category."
      );
    }
  };

  const filteredCategories = categories.filter((category) => {
    const query = search.toLowerCase();

    return (
      category.name.toLowerCase().includes(query) ||
      (category.description || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="admin-categories">
      <div className="admin-categories-header">
        <div>
          <h1>Categories</h1>
          <p>Organize and manage your GreenCart product categories.</p>
        </div>
      </div>

      <div className="category-summary">
        <div className="category-summary-icon">🏷️</div>
        <div>
          <p>Total Categories</p>
          <strong>{categories.length}</strong>
        </div>
      </div>

      <div className="category-form-card">
        <h2>{editingId !== null ? "Edit Category" : "Add New Category"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="category-form-fields">
            <div className="category-form-group">
              <label htmlFor="category-name">Category Name *</label>
              <input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Skin Care"
                required
              />
            </div>

            <div className="category-form-group">
              <label htmlFor="category-description">Description</label>
              <input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief category description"
              />
            </div>
          </div>

          {error && (
            <p className="category-error" role="alert">
              {error}
            </p>
          )}

          <div className="category-form-actions">
            <button
              type="submit"
              className="category-save-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Category"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="category-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="category-list-card">
        <div className="category-list-header">
          <div>
            <h2>All Categories</h2>
            <p>Manage the categories in your store.</p>
          </div>

          <input
            type="search"
            aria-label="Search categories"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="category-empty">
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="category-empty">
            <span>🏷️</span>
            <h3>No categories found</h3>
            <p>Add a category or change your search.</p>
          </div>
        ) : (
          <div className="category-table-container">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => {
                  const productCount = products.filter(
                    (product) => product.category === category.name
                  ).length;

                  return (
                    <tr key={getCategoryId(category)}>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.description || "No description"}</td>
                      <td>
                        <span className="category-product-count">
                          {productCount}
                        </span>
                      </td>
                      <td>
                        <div className="category-actions">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="category-delete-btn"
                            onClick={() => handleDelete(category)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCategories;
