
import { useEffect, useState } from "react";
import CartContext from "./CartContext";

function CartProvider({ children }) {
  // Load saved cart items when the application starts
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("greencart_cart");

      if (!savedCart) {
        return [];
      }

      const parsedCart = JSON.parse(savedCart);

      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  });

  const [cartMessage, setCartMessage] = useState("");

  // Save cart items whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "greencart_cart",
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Error saving cart:", error);
      setCartMessage("Unable to save your cart.");
    }
  }, [cartItems]);

  // Get a consistent product ID
  const getProductId = (product) =>
    String(product?.id ?? product?._id ?? "");

  // Add a product to the cart
  const addToCart = (product) => {
    const productId = getProductId(product);
    const stock = Number(product.stock ?? 99);

    if (!productId) {
      setCartMessage("Unable to add this product.");
      return;
    }

    if (!Number.isFinite(stock) || stock <= 0) {
      setCartMessage("This product is out of stock.");
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => getProductId(item) === productId
      );

      if (existingItem) {
        const currentQuantity = Number(existingItem.quantity) || 1;

        if (currentQuantity >= stock) {
          setCartMessage("Maximum available stock reached.");
          return currentItems;
        }

        setCartMessage(`${product.name} quantity updated!`);

        return currentItems.map((item) =>
          getProductId(item) === productId
            ? {
                ...item,
                stock,
                quantity: currentQuantity + 1,
              }
            : item
        );
      }

      setCartMessage(`${product.name || "Product"} added to cart!`);

      return [
        ...currentItems,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });

    setTimeout(() => {
      setCartMessage("");
    }, 2500);
  };

  // Remove a product completely
  const removeFromCart = (productId) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => getProductId(item) !== String(productId)
      )
    );

    setCartMessage("Product removed from cart.");

    setTimeout(() => {
      setCartMessage("");
    }, 2500);
  };

  // Increase quantity without exceeding available stock
  const increaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (getProductId(item) !== String(productId)) {
          return item;
        }

        const stock = Number(item.stock ?? 99);
        const quantity = Number(item.quantity) || 1;

        if (quantity >= stock) {
          setCartMessage("Maximum available stock reached.");
          return item;
        }

        return {
          ...item,
          quantity: quantity + 1,
        };
      })
    );
  };

  // Decrease quantity; remove the item at zero
  const decreaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (getProductId(item) !== String(productId)) {
            return item;
          }

          return {
            ...item,
            quantity: (Number(item.quantity) || 1) - 1,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Empty the entire cart
  const clearCart = () => {
    setCartItems([]);
    setCartMessage("Your cart has been cleared.");

    setTimeout(() => {
      setCartMessage("");
    }, 2500);
  };

  // Total quantity of all products
  const cartCount = cartItems.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.quantity) || 0),
    0
  );

  // Total price of all products
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total +
      Math.max(0, Number(item.price) || 0) *
        Math.max(0, Number(item.quantity) || 0),
    0
  );

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    cartMessage,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
