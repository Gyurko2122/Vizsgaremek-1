import { useState, useEffect } from "react";

const fixImageUrl = (url) => {
  if (!url) return "/img/placeholder.png";
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return url;
  return "/" + url;
};

export default function Favorites({ username, onProductClick, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(`/api/favorites/${username}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [username]);

  const removeFavorite = async (e, productId) => {
    e.stopPropagation();
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, productId }),
      });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <button className="back-btn" onClick={onClose}>
            ← Vissza
          </button>
          <h2>★ Kedvenc hirdetéseim</h2>
        </div>

        {loading && <p className="loading-text">Betöltés...</p>}

        {!loading && products.length === 0 && (
          <div className="favorites-empty">
            <p>Még nincsenek kedvenc hirdetéseid.</p>
            <p>A ☆ gombbal adhatsz hozzá termékeket a kedvencekhez.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="favorites-grid">
            {products.map((product) => (
              <div
                key={product._id}
                className="product-card"
                onClick={() => onProductClick(product._id)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-card-image">
                  <button
                    className="favorite-star active"
                    onClick={(e) => removeFavorite(e, product._id)}
                    title="Eltávolítás a kedvencekből"
                  >
                    ★
                  </button>
                  <img
                    src={fixImageUrl(product.imageUrl)}
                    alt={product.productName}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23666'%3EKép nem elérhető%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="product-card-info">
                  <h3 className="product-card-name">{product.productName}</h3>
                  <p className="product-card-description">
                    {product.description.substring(0, 80)}...
                  </p>
                  <div className="product-card-footer">
                    <span className="product-card-price">
                      {product.price} Ft
                    </span>
                    <span className="product-card-location">
                      {product.location}
                    </span>
                  </div>
                  <p className="product-card-seller">
                    Eladó: {product.createdBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
