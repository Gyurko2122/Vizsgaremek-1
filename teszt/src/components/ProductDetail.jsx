import { useState, useEffect } from "react";
import "./ProductDetail.css";

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

export default function ProductDetail({
  productId,
  onBack,
  isLoggedIn,
  currentUser,
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);

  // Termék adatainak lekérése
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Cache-busting: timestamp hozzáadása az URL-hez
        const timestamp = Date.now();
        const response = await fetch(
          `/api/products/${productId}?t=${timestamp}`,
        );
        if (!response.ok) {
          throw new Error("Termék nem található");
        }
        const data = await response.json();
        setProduct(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Üzenet küldése
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    if (!isLoggedIn) {
      return;
    }

    setMessageSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUser: currentUser,
          toUser: product.createdBy,
          message: messageText,
          productId: product._id,
          productName: product.productName,
        }),
      });

      if (!response.ok) {
        throw new Error("Hiba az üzenet küldésénél");
      }

      setMessageSuccess(true);
      setMessageText("");
      setShowMessageForm(false);

      setTimeout(() => {
        setMessageSuccess(false);
      }, 3000);
    } catch (err) {
      alert("Hiba az üzenet küldésénél: " + err.message);
    } finally {
      setMessageSending(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <button className="back-button" onClick={onBack}>
          ← Vissza
        </button>
        <p className="loading">Betöltés...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <button className="back-button" onClick={onBack}>
          ← Vissza
        </button>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <button className="back-button" onClick={onBack}>
          ← Vissza
        </button>
        <p className="error">Termék nem található</p>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <button className="back-button" onClick={onBack}>
        ← Vissza
      </button>

      <div className="product-detail-content">
        <div className="product-image-wrapper">
          <img
            src={fixImageUrl(product.imageUrl)}
            alt={product.productName}
            className="product-detail-image"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23666'%3EKép nem elérhető%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>

        <div className="product-info">
          <h1 className="product-name">{product.productName}</h1>

          <div className="product-price">
            <span className="price-label">Ár:</span>
            <span className="price-value">{product.price} Ft</span>
          </div>

          <div className="product-location">
            <span className="location-label">📍 Helyszín:</span>
            <span className="location-value">{product.location}</span>
          </div>

          <div className="product-seller">
            <span className="seller-label">Eladó:</span>
            <span className="seller-name">{product.createdBy}</span>
          </div>

          <div className="product-date">
            <span className="date-label">Feltöltve:</span>
            <span className="date-value">
              {new Date(product.createdAt).toLocaleDateString("hu-HU")}
            </span>
          </div>

          <div className="product-description">
            <h3>Leírás:</h3>
            <p>{product.description}</p>
          </div>

          {currentUser !== product.createdBy && (
            <div className="message-section">
              {!showMessageForm ? (
                <button
                  className="send-message-button"
                  onClick={() => setShowMessageForm(true)}
                  disabled={!isLoggedIn}
                >
                  💬 Üzenet az eladónak
                </button>
              ) : (
                <form className="message-form" onSubmit={handleSendMessage}>
                  <textarea
                    className="message-textarea"
                    placeholder="Írja be az üzenetét..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows="4"
                  />
                  <div className="message-buttons">
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={messageSending}
                    >
                      {messageSending ? "Küldés..." : "Küldés"}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowMessageForm(false);
                        setMessageText("");
                      }}
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              )}

              {messageSuccess && (
                <p className="success-message">✓ Üzenet sikeresen küldve!</p>
              )}
            </div>
          )}

          {currentUser === product.createdBy && (
            <div className="own-product-notice">
              <p>Ez az Ön terméke</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
