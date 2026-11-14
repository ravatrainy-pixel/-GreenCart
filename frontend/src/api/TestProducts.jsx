
import { useEffect, useState } from "react";
import { getProducts } from "./productService";

function TestProducts() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        setError(
          err.response?.data?.message ||
          "Could not load products. Check that Flask and MongoDB are running."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "24px" }}>
      <h1>GreenCart Database Products</h1>

      {products.length === 0 ? (
        <p>No products found in MongoDB.</p>
      ) : (
        products.map((product) => (
          <div
            key={product._id}
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              marginBottom: "12px",
              borderRadius: "8px",
            }}
          >
            <h3>{product.name}</h3>
            <p>Category: {product.category}</p>
            <p>Price: ₹{product.price}</p>
            <p>Stock: {product.stock}</p>
            <p>{product.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default TestProducts;
