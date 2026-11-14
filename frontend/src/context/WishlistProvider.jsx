
import { useEffect, useState } from "react";
import WishlistContext from "./WishlistContext";

function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem("greencartWishlist");
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error("Error loading wishlist:", error);
      return [];
    }
  });

  const [wishlistMessage, setWishlistMessage] = useState("");

  // Save wishlist whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "greencartWishlist",
      JSON.stringify(wishlistItems)
    );
  }, [wishlistItems]);

  const addToWishlist = (product) => {
    setWishlistItems((currentItems) => {
      const productId = product.id || product._id;

      const alreadyExists = currentItems.some(
        (item) => (item.id || item._id) === productId
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [
        ...currentItems,
        {
          ...product,
          id: productId,
        },
      ];
    });

    setWishlistMessage(`${product.name} added to wishlist!`);

    setTimeout(() => {
      setWishlistMessage("");
    }, 2500);
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) => (item.id || item._id) !== productId
      )
    );
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(
      (item) => (item.id || item._id) === productId
    );
  };

  const wishlistCount = wishlistItems.length;

  const value = {
    wishlistItems,
    wishlistCount,
    wishlistMessage,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export default WishlistProvider;
