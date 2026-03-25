import { useState, useEffect } from "react";

// Helper function - fix image URLs (handle both relative and absolute)
const fixImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/150"; // Fallback
  // If URL already starts with /, it's relative - return as is
  if (url.startsWith("/")) return url;
  // If URL starts with http, it's absolute - return as is
  if (url.startsWith("http")) return url;
  // Otherwise treat as relative path
  return "/" + url;
};

export default function Profile({ username, onBack }) {
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [profileImage, setProfileImage] = useState(
    "https://via.placeholder.com/150",
  );
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
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
            <div className="profile-info">
              <h1 id="profile-username">{username}</h1>
              <p id="profile-email">{userEmail}</p>
            </div>
          </div>

          <div className="profile-actions">
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
            <button className="delete-btn">Profil törlése</button>
          </div>
        </div>

        <div className="user-ads-section">
          <h2>Saját hirdetéseim</h2>

          <div className="ads-grid">
            {/* New Ad Card - Always First */}
            <div
              className="ad-card new-ad-card-container"
              onClick={() => setShowNewAdForm(!showNewAdForm)}
            >
              <div className="new-ad-placeholder">
                <h3>{showNewAdForm ? "✕ Mégsem" : "+ Új hirdetés"}</h3>
              </div>
            </div>

            {/* Existing Ads - Sorted by Date */}
            {loading ? (
              <p>Hirdetések betöltése...</p>
            ) : userAds.length > 0 ? (
              userAds.map((ad) => (
                <div key={ad._id} className="ad-card">
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
                  <div
                    className="ad-card-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="ad-edit-btn"
                      onClick={() => setEditingAdId(ad._id)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Szerkesztés
                    </button>
                    <button
                      className="ad-delete-btn"
                      onClick={() => handleDeleteAd(ad._id)}
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

          {/* Edit Ad Form */}
          {editingAdId && (
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
          )}

          {/* New Ad Form */}
          {showNewAdForm && (
            <NewAdForm
              username={username}
              onAdCreated={() => {
                setShowNewAdForm(false);
                fetchUserData();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NewAdForm({ username, onAdCreated }) {
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    location: "",
    price: "",
    imageFile: null,
    imagePreview: null,
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
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.productName ||
      !formData.description ||
      !formData.location ||
      !formData.price ||
      !formData.imageFile
    ) {
      return;
    }

    setLoading(true);

    try {
      // First upload the image
      const imageFormData = new FormData();
      imageFormData.append("file", formData.imageFile);

      const imageResponse = await fetch("/api/upload/product-image", {
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

      // Then create the product with the image URL
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
          imageUrl: imageData.imageUrl, // Az URL már tartalmaz cache-buste (timestamp)
        }),
      });

      if (productResponse.ok) {
        setFormData({
          productName: "",
          description: "",
          location: "",
          price: "",
          imageFile: null,
          imagePreview: null,
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
    <form className="new-ad-form" onSubmit={handleSubmit}>
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
        <label htmlFor="imageFile">Kép feltöltése *</label>
        <input
          type="file"
          id="imageFile"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
        {formData.imagePreview && (
          <div className="image-preview">
            <img src={formData.imagePreview} alt="Előnézet" />
            <small>Kiválasztott: {formData.imageFile.name}</small>
          </div>
        )}
      </div>

      <button type="submit" className="btn-submit-ad" disabled={loading}>
        {loading ? "Feltöltés folyamatban..." : "Hirdetés közzététele"}
      </button>
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
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    <form
      className="edit-ad-form"
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginTop: "20px",
        border: "2px solid #007bff",
      }}
    >
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

      <div style={{ display: "flex", gap: "10px" }}>
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
