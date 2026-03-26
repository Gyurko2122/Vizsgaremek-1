import { useState, useEffect } from "react";

const fixImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return url;
  return "/" + url;
};

export default function SearchResults({
  query,
  onProfileClick,
  onProductClick,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [filter, setFilter] = useState("all"); // "all", "users", "products"
  const [results, setResults] = useState({ users: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async (q) => {
    if (!q || q.trim().length < 1) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`,
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query && query.trim().length >= 1) {
      performSearch(query);
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const filteredUsers = filter === "products" ? [] : results.users || [];
  const filteredProducts = filter === "users" ? [] : results.products || [];
  const totalCount = filteredUsers.length + filteredProducts.length;

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <h2 className="search-results-title">Kereső</h2>
        <form className="search-results-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="search-results-input"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="search-results-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div className="search-results-filters">
          <button
            className={`search-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Minden
          </button>
          <button
            className={`search-filter-btn ${filter === "products" ? "active" : ""}`}
            onClick={() => setFilter("products")}
          >
            Termék
          </button>
          <button
            className={`search-filter-btn ${filter === "users" ? "active" : ""}`}
            onClick={() => setFilter("users")}
          >
            Személy
          </button>
        </div>

        <div className="search-results-divider" />

        {loading ? (
          <p className="search-results-status">Keresés...</p>
        ) : searched ? (
          <>
            <p className="search-results-count">
              Találatok száma: {totalCount}
            </p>

            {filteredUsers.length > 0 && (
              <div className="search-results-section">
                <h3 className="search-results-section-title">Személyek</h3>
                <div className="search-results-list">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.username}
                      className="search-result-item search-result-user"
                      onClick={() => onProfileClick(user.username)}
                    >
                      <img
                        className="search-result-avatar"
                        src={
                          fixImageUrl(user.picture) ||
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E"
                        }
                        alt={user.username}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <span className="search-result-name">
                        {user.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="search-results-section">
                <h3 className="search-results-section-title">Termékek</h3>
                <div className="search-results-list">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="search-result-item search-result-product"
                      onClick={() => onProductClick(product._id)}
                    >
                      {product.imageUrl && (
                        <img
                          className="search-result-product-img"
                          src={fixImageUrl(product.imageUrl)}
                          alt={product.productName}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div className="search-result-product-info">
                        <span className="search-result-name">
                          {product.productName}
                        </span>
                        <span className="search-result-price">
                          {product.price.toLocaleString("hu-HU")} Ft
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalCount === 0 && (
              <p className="search-results-empty">
                Nincs találat a keresésedre.
              </p>
            )}
          </>
        ) : (
          <p className="search-results-status">
            Írj be valamit a keresőbe és nyomj Entert.
          </p>
        )}
      </div>
    </div>
  );
}
