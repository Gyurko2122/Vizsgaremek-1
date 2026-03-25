import { useState, useEffect } from "react";

// Helper function - fix image URLs (handle both relative and absolute)
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23334155' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='%2394a3b8'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

const fixImageUrl = (url) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return url;
  return "/" + url;
};

export default function Profile({
  username,
  onBack,
  isOwnProfile = true,
  onDeleteAccount,
  onProductClick,
}) {
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAdForm, setShowNewAdForm] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);

  useEffect(() => {
    // Fetch user data and their ads
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Cache-busting: timestamp hozzáadása az URLhez
      const timestamp = Date.now();
      const response = await fetch(`/api/user/${username}?t=${timestamp}`);
      if (response.ok) {
        const data = await response.json();
        setUserEmail(data.email);
        if (data.picture) {
          // Az URL-ben már van versió, de biztosabb megoldás
          setProfileImage(fixImageUrl(data.picture));
        }
      } else {
        console.error("Error fetching user data:", response.status);
      }

      // Termékleteöltés - szintén cache-bustig-gal
      const productsResponse = await fetch(
        `/api/products/user/${username}?t=${timestamp}`,
      );
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        // Sort by createdAt descending (newest first)
        const sorted = products.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setUserAds(sorted);
      } else {
        console.error("Error fetching products:", productsResponse.status);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `/api/upload/profile-picture?username=${username}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Force refresh az új URL-lel
        setProfileImage(fixImageUrl(data.imageUrl));

        // Frissítsd az adatokat az adatbázisból
        setTimeout(() => {
          fetchUserData();
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Hiba: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Hiba a feltöltés során!");
    }
  };

  const handleDeleteAd = async (productId) => {
    if (!window.confirm("Biztos, hogy törlöd ezt a hirdetést?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        setUserAds(userAds.filter((ad) => ad._id !== productId));
      } else {
        alert("Hiba a hirdetés törlésénél!");
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Hiba az adatbázis kommunikáció során!");
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Biztos, hogy törölni szeretnéd a fiókodat? Ez a művelet NEM visszavonható! Az összes hirdetésed, üzeneted és kedvenced törlődik.",
      )
    )
      return;

    const confirmName = window.prompt(
      "Kérjük, írd be a felhasználóneved a megerősítéshez:",
    );
    if (confirmName !== username) {
      alert("A felhasználónév nem egyezik. A törlés megszakítva.");
      return;
    }

    try {
      const response = await fetch(`/api/user/${username}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmUsername: username }),
      });

      if (response.ok) {
        alert("Fiók sikeresen törölve.");
        if (onDeleteAccount) onDeleteAccount();
      } else {
        const data = await response.json();
        alert(`Hiba: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Hiba a fiók törlése során!");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-btn" onClick={onBack}>
          ← Vissza
        </button>

        <div className="profile-card">
          <div className="profile-header">
            <img
              id="profile-image"
              src={profileImage}
              alt={username}
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            <div className="profile-info">
              <h1 id="profile-username">{username}</h1>
              <p id="profile-email">{userEmail}</p>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile && (
              <>
                <label htmlFor="profile-upload" className="upload-btn">
                  Profilkép feltöltése
                  <input
                    type="file"
                    id="profile-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProfileImageUpload}
                  />
                </label>
                <button className="delete-btn" onClick={handleDeleteAccount}>
                  Profil törlése
                </button>
              </>
            )}
          </div>
        </div>

        <div className="user-ads-section">
          <h2>
            {isOwnProfile ? "Saját hirdetéseim" : `${username} hirdetései`}
          </h2>

          <div className="ads-grid">
            {/* New Ad Card - Always First (only own profile) */}
            {isOwnProfile && (
              <div
                className="ad-card new-ad-card-container"
                onClick={() => setShowNewAdForm(true)}
              >
                <div className="new-ad-placeholder">
                  <h3>+ Új hirdetés</h3>
                </div>
              </div>
            )}

            {/* Existing Ads - Sorted by Date */}
            {loading ? (
              <p>Hirdetések betöltése...</p>
            ) : userAds.length > 0 ? (
              userAds.map((ad) => (
                <div
                  key={ad._id}
                  className="ad-card"
                  onClick={() => {
                    if (isOwnProfile) {
                      setEditingAdId(ad._id);
                    } else if (onProductClick) {
                      onProductClick(ad._id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="ad-card-image-container">
                    <img
                      src={fixImageUrl(ad.imageUrl)}
                      alt={ad.productName}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23666'%3EKép nem elérhető%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="ad-card-info">
                    <h3>{ad.productName}</h3>
                    <p className="ad-location">{ad.location}</p>
                    <p className="ad-description">{ad.description}</p>
                    <p className="ad-price">{ad.price} Ft</p>
                  </div>
                  {isOwnProfile && (
                    <div
                      className="ad-card-actions"
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <button
                        className="ad-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAd(ad._id);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Törlés
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              !loading && (
                <p style={{ gridColumn: "1 / -1" }}>
                  Még nincsenek hirdetéseid
                </p>
              )
            )}
          </div>

          {/* Edit Ad Modal */}
          {editingAdId && (
            <div className="modal-overlay" onClick={() => setEditingAdId(null)}>
              <div
                className="modal-window"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "550px" }}
              >
                <button
                  className="modal-close"
                  onClick={() => setEditingAdId(null)}
                >
                  ×
                </button>
                <EditAdForm
                  username={username}
                  adId={editingAdId}
                  ad={userAds.find((a) => a._id === editingAdId)}
                  onAdUpdated={() => {
                    setEditingAdId(null);
                    fetchUserData();
                  }}
                  onCancel={() => setEditingAdId(null)}
                />
              </div>
            </div>
          )}

          {/* New Ad Modal */}
          {isOwnProfile && showNewAdForm && (
            <div
              className="modal-overlay"
              onClick={() => setShowNewAdForm(false)}
            >
              <div
                className="modal-window"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "550px" }}
              >
                <button
                  className="modal-close"
                  onClick={() => setShowNewAdForm(false)}
                >
                  ×
                </button>
                <NewAdForm
                  username={username}
                  onAdCreated={() => {
                    setShowNewAdForm(false);
                    fetchUserData();
                  }}
                  onCancel={() => setShowNewAdForm(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewAdForm({ username, onAdCreated, onCancel }) {
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    location: "",
    price: "",
    imageFiles: [],
    imagePreviews: [],
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
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
          setFormData((prev) => ({
            ...prev,
            imageFiles: [...prev.imageFiles, ...files],
            imagePreviews: [...prev.imagePreviews, ...previews],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.productName ||
      !formData.description ||
      !formData.location ||
      !formData.price ||
      formData.imageFiles.length === 0
    ) {
      return;
    }

    setLoading(true);

    try {
      // Upload all images
      const imageFormData = new FormData();
      formData.imageFiles.forEach((file) => {
        imageFormData.append("files", file);
      });

      const imageResponse = await fetch("/api/upload/product-images", {
        method: "POST",
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("Image upload error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert(`Kép feltöltési hiba: ${errorData.error}`);
        } catch {
          alert(`Kép feltöltési hiba: ${imageResponse.status}`);
        }
        setLoading(false);
        return;
      }

      const imageData = await imageResponse.json();

      // Then create the product with the image URLs
      const productResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          productName: formData.productName,
          description: formData.description,
          location: formData.location,
          price: parseFloat(formData.price),
          imageUrl: imageData.imageUrls[0],
          images: imageData.imageUrls,
        }),
      });

      if (productResponse.ok) {
        setFormData({
          productName: "",
          description: "",
          location: "",
          price: "",
          imageFiles: [],
          imagePreviews: [],
        });
        onAdCreated();
      } else {
        const errorText = await productResponse.text();
        console.error("Product creation error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert(`Hiba: ${errorData.error}`);
        } catch {
          alert(`Hirdetés létrehozási hiba: ${productResponse.status}`);
        }
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      alert(`Hiba: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="edit-ad-form" onSubmit={handleSubmit}>
      <h3>Új hirdetés létrehozása</h3>

      <div className="form-group">
        <label htmlFor="productName">Terméknév *</label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          placeholder="pl. iPhone 13"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Leírás *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Részletesen írj le a termékről..."
          rows="3"
          required
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="location">Hely/Város *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="pl. Budapest"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="price">Ár (Ft) *</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          placeholder="pl. 150000"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="imageFile">Képek feltöltése * (max 10)</label>
        <input
          type="file"
          id="imageFile"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        {formData.imagePreviews.length > 0 && (
          <div className="multi-image-preview">
            {formData.imagePreviews.map((item, index) => (
              <div key={index} className="preview-item">
                <img src={item.preview} alt={`Előnézet ${index + 1}`} />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={() => removeImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", gridColumn: "1 / -1" }}>
        <button
          type="submit"
          className="btn-submit-ad"
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Feltöltés folyamatban..." : "Hirdetés közzététele"}
        </button>
        <button
          type="button"
          className="btn-cancel-ad"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Mégsem
        </button>
      </div>
    </form>
  );
}

function EditAdForm({ username, adId, ad, onAdUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    productName: ad?.productName || "",
    description: ad?.description || "",
    location: ad?.location || "",
    price: ad?.price || "",
  });
  const [existingImages, setExistingImages] = useState(
    ad?.images && ad.images.length > 0
      ? ad.images
      : ad?.imageUrl
        ? [ad.imageUrl]
        : [],
  );
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewFiles = (e) => {
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
          setNewImageFiles((prev) => [...prev, ...files]);
          setNewImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.productName ||
      !formData.description ||
      !formData.location ||
      !formData.price
    ) {
      return;
    }

    setLoading(true);

    try {
      let allImages = [...existingImages];

      // Upload new images if any
      if (newImageFiles.length > 0) {
        const imageFormData = new FormData();
        newImageFiles.forEach((file) => {
          imageFormData.append("files", file);
        });

        const imageResponse = await fetch("/api/upload/product-images", {
          method: "POST",
          body: imageFormData,
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          allImages = [...allImages, ...imageData.imageUrls];
        }
      }

      const response = await fetch(`/api/products/${adId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          productName: formData.productName,
          description: formData.description,
          location: formData.location,
          price: parseFloat(formData.price),
          images: allImages.length > 0 ? allImages : undefined,
          imageUrl: allImages.length > 0 ? allImages[0] : undefined,
        }),
      });

      if (response.ok) {
        onAdUpdated();
      } else {
        const errorData = await response.json();
        alert(`Hiba: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating ad:", error);
      alert(`Hiba: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="edit-ad-form" onSubmit={handleSubmit}>
      <h3>Hirdetés szerkesztése</h3>

      <div className="form-group">
        <label htmlFor="editProductName">Terméknév *</label>
        <input
          type="text"
          id="editProductName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          placeholder="pl. iPhone 13"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="editDescription">Leírás *</label>
        <textarea
          id="editDescription"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Részletesen írj le a termékről..."
          rows="3"
          required
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="editLocation">Hely/Város *</label>
        <input
          type="text"
          id="editLocation"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="pl. Budapest"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="editPrice">Ár (Ft) *</label>
        <input
          type="number"
          id="editPrice"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          placeholder="pl. 150000"
          min="0"
          required
        />
      </div>

      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label>Képek</label>
        {existingImages.length > 0 && (
          <div className="multi-image-preview">
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="preview-item">
                <img src={fixImageUrl(img)} alt={`Kép ${index + 1}`} />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={() => removeExistingImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {newImagePreviews.length > 0 && (
          <div className="multi-image-preview" style={{ marginTop: "0.5rem" }}>
            {newImagePreviews.map((item, index) => (
              <div key={`new-${index}`} className="preview-item">
                <img src={item.preview} alt={`Új kép ${index + 1}`} />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={() => removeNewImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleNewFiles}
          style={{ marginTop: "0.5rem" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", gridColumn: "1 / -1" }}>
        <button
          type="submit"
          className="btn-submit-ad"
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Mentés folyamatban..." : "💾 Mentés"}
        </button>
        <button
          type="button"
          className="btn-cancel-ad"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Mégsem
        </button>
      </div>
    </form>
  );
}
