import { useState, useEffect } from "react";

// Helper function - fix image URLs (handle both relative and absolute)
const fixImageUrl = (url) => {
  if (!url) return "/img/placeholder.png"; // Fallback
  // If URL already starts with /, it's relative - return as is
  if (url.startsWith("/")) return url;
  // If URL starts with http, it's absolute - return as is
  if (url.startsWith("http")) return url;
  // Otherwise treat as relative path
  return "/" + url;
};

export default function Body({ onProductClick, isLoggedIn, currentUser }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Cache-busting: timestamp hozzáadása az URL-hez
        const timestamp = Date.now();
        const response = await fetch(`/api/products?t=${timestamp}`);
        if (!response.ok) {
          throw new Error("Termékek letöltése sikertelen");
        }
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch user favorites
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const fetchFavorites = async () => {
      try {
        const response = await fetch(`/api/favorites/${currentUser}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(new Set(data.productIds));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };
    fetchFavorites();
  }, [isLoggedIn, currentUser]);

  const toggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!isLoggedIn) return;

    const isFav = favorites.has(productId);
    try {
      if (isFav) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, productId }),
        });
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, productId }),
        });
        setFavorites((prev) => new Set(prev).add(productId));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  return (
    <main>
      <div className="hero-banner">
        <img src="img/asd.webp" className="hero-img" alt="Piactér" />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-9">
            <section className="latest-ads">
              <h2>Legújabb Termékek</h2>
              <div id="all-ads-container" className="ads-grid">
                {loading && (
                  <p className="loading-text">Termékek betöltése...</p>
                )}
                {error && <p className="error-text">Hiba: {error}</p>}
                {!loading && products.length === 0 && (
                  <p className="no-products">Még nincsenek termékek</p>
                )}
                {!loading &&
                  products.map((product) => (
                    <div
                      key={product._id}
                      className="product-card"
                      onClick={() => onProductClick(product._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="product-card-image">
                        {isLoggedIn && (
                          <button
                            className={`favorite-star ${favorites.has(product._id) ? "active" : ""}`}
                            onClick={(e) => toggleFavorite(e, product._id)}
                            title={
                              favorites.has(product._id)
                                ? "Eltávolítás a kedvencekből"
                                : "Kedvencekhez adás"
                            }
                          >
                            {favorites.has(product._id) ? "★" : "☆"}
                          </button>
                        )}
                        {/* Lazy loading képekhez */}
                        <img
                          src={fixImageUrl(
                            product.imageUrl ||
                              (product.images && product.images[0]),
                          )}
                          alt={product.productName}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23666'%3EKép nem elérhető%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div className="product-card-info">
                        <h3 className="product-card-name">
                          {product.productName}
                        </h3>
                        <p className="product-card-description">
                          {product.description.substring(0, 80)}...
                        </p>
                        <p className="product-card-location">
                          <span className="product-card-label">Helyszín:</span>{" "}
                          {product.location}
                        </p>
                        <p className="product-card-price">
                          {product.price.toLocaleString("hu-HU")} Ft
                        </p>
                        <p className="product-card-seller">
                          Eladó: {product.createdBy}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
          <div className="col-3">
            <section className="news-section">
              <h2 id="news">Hírek</h2>
              <div className="news-items">
                <div className="news-item">
                  <h3>Új kézműves kategória</h3>
                  <p className="news-date">2025. október 9.</p>
                  <p>
                    Új kerámiák és agyagedények kategória nyílt! Fedezze fel
                    egyedi kézműves termékeinket.
                  </p>
                </div>
                <div className="news-item">
                  <h3>Őszi vásár</h3>
                  <p className="news-date">2025. október 8.</p>
                  <p>
                    Készüljön az őszre kézműves dekorációkkal! Különleges
                    ajánlatok egész héten.
                  </p>
                </div>
                <div className="news-item">
                  <h3>Kézműves workshop</h3>
                  <p className="news-date">2025. október 7.</p>
                  <p>
                    Hétvégi workshop: Tanulja meg a kosárfonás alapjait helyi
                    mesterektől!
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
