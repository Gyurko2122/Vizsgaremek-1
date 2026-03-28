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
  onSellerClick,
  onMessageSent,
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    productName: "",
    description: "",
    location: "",
    price: "",
  });
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Termék adatainak lekérése
  const fetchProduct = async () => {
    try {
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

  useEffect(() => {
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

      setMessageText("");
      setShowMessageForm(false);

      // Redirect to messages page to show the conversation
      if (onMessageSent) {
        onMessageSent(product.createdBy, product._id, product.productName);
      } else {
        setMessageSuccess(true);
        setTimeout(() => {
          setMessageSuccess(false);
        }, 3000);
      }
    } catch (err) {
      alert("Hiba az üzenet küldésénél: " + err.message);
    } finally {
      setMessageSending(false);
    }
  };

  // Edit handlers
  const openEditForm = () => {
    if (!product) return;
    setEditFormData({
      productName: product.productName,
      description: product.description,
      location: product.location,
      price: product.price,
    });
    setEditExistingImages(
      product.images && product.images.length > 0
        ? [...product.images]
        : product.imageUrl
          ? [product.imageUrl]
          : [],
    );
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setShowEditForm(true);
  };

  const handleEditNewFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const previews = [];
    let loaded = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push({ file, preview: reader.result });
        loaded++;
        if (loaded === files.length) {
          setEditNewFiles((prev) => [...prev, ...files]);
          setEditNewPreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.productName || !editFormData.description || !editFormData.location || !editFormData.price) return;
    setEditLoading(true);
    try {
      let allImages = [...editExistingImages];
      if (editNewFiles.length > 0) {
        const imageFormData = new FormData();
        editNewFiles.forEach((file) => imageFormData.append("files", file));
        const imageResponse = await fetch("/api/upload/product-images", { method: "POST", body: imageFormData });
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          allImages = [...allImages, ...imageData.imageUrls];
        }
      }
      const response = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          productName: editFormData.productName,
          description: editFormData.description,
          location: editFormData.location,
          price: parseFloat(editFormData.price),
          images: allImages.length > 0 ? allImages : undefined,
          imageUrl: allImages.length > 0 ? allImages[0] : undefined,
        }),
      });
      if (response.ok) {
        setShowEditForm(false);
        setCurrentImageIndex(0);
        fetchProduct();
      } else {
        const errorData = await response.json();
        alert(`Hiba: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert(`Hiba: ${error.message}`);
    } finally {
      setEditLoading(false);
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
          {(() => {
            const images =
              product.images && product.images.length > 0
                ? product.images
                : product.imageUrl
                  ? [product.imageUrl]
                  : [];
            return (
              <>
                {images.length > 1 && (
                  <button
                    className="carousel-arrow carousel-arrow-left"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1,
                      )
                    }
                  >
                    ‹
                  </button>
                )}
                <img
                  src={fixImageUrl(
                    images[currentImageIndex] || product.imageUrl,
                  )}
                  alt={product.productName}
                  className="product-detail-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23666'%3EKép nem elérhető%3C/text%3E%3C/svg%3E";
                  }}
                />
                {images.length > 1 && (
                  <button
                    className="carousel-arrow carousel-arrow-right"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1,
                      )
                    }
                  >
                    ›
                  </button>
                )}
                {images.length > 1 && (
                  <div className="carousel-dots">
                    {images.map((_, index) => (
                      <span
                        key={index}
                        className={`carousel-dot ${index === currentImageIndex ? "active" : ""}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
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
            <span
              className="seller-name seller-link"
              onClick={() => onSellerClick && onSellerClick(product.createdBy)}
              style={{ cursor: onSellerClick ? "pointer" : "default" }}
            >
              {product.createdBy}
            </span>
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
            <button
              className="edit-product-button"
              onClick={openEditForm}
            >
              ✏️ Hirdetés szerkesztése
            </button>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <button className="modal-close" onClick={() => setShowEditForm(false)}>×</button>
            <form className="edit-ad-form" onSubmit={handleEditSubmit}>
              <h3>Hirdetés szerkesztése</h3>
              <div className="form-group">
                <label>Terméknév *</label>
                <input type="text" value={editFormData.productName} onChange={(e) => setEditFormData((p) => ({ ...p, productName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Leírás *</label>
                <textarea value={editFormData.description} onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))} rows="3" required />
              </div>
              <div className="form-group">
                <label>Hely/Város *</label>
                <input type="text" value={editFormData.location} onChange={(e) => setEditFormData((p) => ({ ...p, location: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Ár (Ft) *</label>
                <input type="number" value={editFormData.price} onChange={(e) => setEditFormData((p) => ({ ...p, price: e.target.value }))} min="0" required />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Képek</label>
                {editExistingImages.length > 0 && (
                  <div className="multi-image-preview">
                    {editExistingImages.map((img, index) => (
                      <div key={`existing-${index}`} className="preview-item">
                        <img src={fixImageUrl(img)} alt={`Kép ${index + 1}`} />
                        <button type="button" className="remove-preview" onClick={() => setEditExistingImages((prev) => prev.filter((_, i) => i !== index))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {editNewPreviews.length > 0 && (
                  <div className="multi-image-preview" style={{ marginTop: "0.5rem" }}>
                    {editNewPreviews.map((item, index) => (
                      <div key={`new-${index}`} className="preview-item">
                        <img src={item.preview} alt={`Új kép ${index + 1}`} />
                        <button type="button" className="remove-preview" onClick={() => { setEditNewFiles((prev) => prev.filter((_, i) => i !== index)); setEditNewPreviews((prev) => prev.filter((_, i) => i !== index)); }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={handleEditNewFiles} style={{ marginTop: "0.5rem" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", gridColumn: "1 / -1" }}>
                <button type="submit" className="btn-submit-ad" disabled={editLoading} style={{ flex: 1 }}>{editLoading ? "Mentés..." : "💾 Mentés"}</button>
                <button type="button" className="btn-cancel-ad" onClick={() => setShowEditForm(false)} disabled={editLoading} style={{ flex: 1, padding: "10px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Mégsem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
