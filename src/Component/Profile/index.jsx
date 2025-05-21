import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [favorites, setFavorites] = useState([]);
  const [following, setFollowing] = useState([]);
  const [orderedProductIds, setOrderedProductIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
    fetchFollowing();
    fetchOrders();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Yetkisiz erişim. Lütfen giriş yapın.");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `http://localhost:8080/api/v1/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data);
      setFormData({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phoneNumber: response.data.phoneNumber || "",
        bio: response.data.bio || "",
      });
      setLoading(false);
    } catch (error) {
      setError("Profil bilgileri yüklenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");
      if (userType === "BUYER") {
        const response = await axios.get(
          `http://localhost:8080/api/v1/buyer/favorites`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFavorites(response.data);
      }
    } catch (error) {
      setFavorites([]);
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");
      if (userType === "BUYER") {
        const response = await axios.get(
          `http://localhost:8080/api/v1/buyer/following`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFollowing(response.data);
      }
    } catch (error) {
      setFollowing([]);
    }
  };

  // Satın alınan ürünlerin id'lerini çek
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");
      if (userType === "BUYER") {
        const response = await axios.get(
          "http://localhost:8080/api/v1/buyer/orders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const ids = response.data.map((order) => order.product.id);
        setOrderedProductIds(ids);
      }
    } catch (error) {
      setOrderedProductIds([]);
    }
  };

  const handleEdit = () => setEditing(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);
      const response = await axios.post(
        `http://localhost:8080/api/v1/users/${id}/profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(response.data);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
    } catch (error) {
      setError("Profil fotoğrafı yüklenirken bir hata oluştu.");
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:8080/api/v1/users/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUser(response.data);
      setEditing(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Bu profili düzenleme yetkiniz yok.");
      } else {
        setError("Profil güncellenirken bir hata oluştu.");
      }
    }
  };

  const handleFollow = async (sellerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:8080/api/v1/buyer/follow/${sellerId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFollowing();
    } catch (error) {}
  };

  const handleUnfollow = async (sellerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:8080/api/v1/buyer/unfollow/${sellerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFollowing();
    } catch (error) {}
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:8080/api/v1/buyer/favorites/toggle/${productId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFavorites();
    } catch (error) {}
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">Kullanıcı bulunamadı.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={
              previewUrl ||
              (user.profilePicture
                ? `http://localhost:8080/profiles/${user.profilePicture}`
                : "/default-avatar.png")
            }
            alt="Profil"
            className="profile-image"
          />
          {editing && (
            <div className="profile-image-upload">
              <label htmlFor="profile-picture" className="upload-label">
                <i className="fas fa-camera"></i> Fotoğraf Değiştir
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
          )}
        </div>
        {previewUrl && (
          <div className="profile-picture-actions">
            <button
              className="save-picture-button"
              onClick={handleSaveProfilePicture}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Yükleniyor...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Kaydet
                </>
              )}
            </button>
            <button
              className="cancel-picture-button"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              <i className="fas fa-times"></i> İptal
            </button>
          </div>
        )}
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <p>
          {user.userType === "SELLER"
            ? "Satıcı"
            : user.userType === "ADMIN"
            ? "Admin"
            : user.userType === "BUYER"
            ? "Alıcı"
            : ""}
        </p>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <i className="fas fa-user"></i> Profil
        </button>
        {user.userType === "BUYER" && (
          <>
            <button
              className={`tab-button ${
                activeTab === "favorites" ? "active" : ""
              }`}
              onClick={() => setActiveTab("favorites")}
            >
              <i className="fas fa-heart"></i> Favoriler
            </button>
            <button
              className={`tab-button ${
                activeTab === "following" ? "active" : ""
              }`}
              onClick={() => setActiveTab("following")}
            >
              <i className="fas fa-users"></i> Takip Edilenler (
              {following.length})
            </button>
          </>
        )}
      </div>

      {activeTab === "profile" &&
        (editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Ad:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Soyad:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>E-posta:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Telefon:</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Biyografi:</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="save-button">
                <i className="fas fa-save"></i> Kaydet
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cancel-button"
              >
                <i className="fas fa-times"></i> İptal
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-group">
              <label>Ad Soyad:</label>
              <p>
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="info-group">
              <label>E-posta:</label>
              <p>{user.email}</p>
            </div>
            <div className="info-group">
              <label>Telefon:</label>
              <p>{user.phoneNumber || "Belirtilmemiş"}</p>
            </div>
            <div className="info-group">
              <label>Biyografi:</label>
              <p>{user.bio || "Biyografi eklenmemiş"}</p>
            </div>
            <button onClick={handleEdit} className="edit-button">
              <i className="fas fa-edit"></i> Profili Düzenle
            </button>
          </div>
        ))}

      {activeTab === "favorites" && (
        <div className="favorites-grid">
          {favorites.filter(
            (fav) => !orderedProductIds.includes(fav.product.id)
          ).length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-heart-broken"></i>
              <p>Henüz favori ürününüz bulunmuyor.</p>
            </div>
          ) : (
            favorites
              .filter((fav) => !orderedProductIds.includes(fav.product.id))
              .map((favorite) => {
                const product = favorite.product;
                return (
                  <div
                    key={product.id}
                    className="product-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="product-image-profile">
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? `http://localhost:8080/uploads/products/${
                                product.id
                              }/${product.images[0].split("/").pop()}`
                            : "/placeholder.png"
                        }
                        alt={product.title}
                      />
                      <div className="product-price-tag">
                        {product.price} TL
                      </div>
                    </div>
                    <div className="product-info">
                      <h3>{product.title}</h3>
                      <p className="seller">
                        <i className="fas fa-store"></i>{" "}
                        {product.seller?.firstName || "Satıcı"}
                      </p>
                      <button
                        className="favorite-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(product.id);
                        }}
                      >
                        <i className="fas fa-heart"></i> Favorilerden Çıkar
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div className="following-grid">
          {following.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-friends"></i>
              <p>Henüz takip ettiğiniz satıcı bulunmuyor.</p>
            </div>
          ) : (
            following.map((seller) => (
              <div key={seller.id} className="seller-card">
                <div className="seller-header">
                  <img
                    src={
                      seller.profilePicture
                        ? `http://localhost:8080/profiles/${seller.profilePicture}`
                        : "/default-avatar.png"
                    }
                    alt={seller.firstName}
                  />
                  <div className="seller-stats">
                    <div className="stat">
                      <span className="value">{seller.productCount}</span>
                      <span className="label">Ürün</span>
                    </div>
                    <div className="stat">
                      <span className="value">{seller.followerCount}</span>
                      <span className="label">Takipçi</span>
                    </div>
                    <div className="stat">
                      <span className="value">
                        {seller.sellerRating || "0.0"}
                      </span>
                      <span className="label">Puan</span>
                    </div>
                  </div>
                </div>
                <div className="seller-info">
                  <h3>
                    {seller.firstName} {seller.lastName}
                  </h3>
                  <p className="seller-bio">{seller.bio || "Biyografi yok"}</p>
                  <div className="seller-actions">
                    <button
                      className="view-store-button"
                      onClick={() => navigate(`/seller/${seller.id}`)}
                    >
                      <i className="fas fa-store"></i> Mağazaya Git
                    </button>
                    <button
                      className="unfollow-button"
                      onClick={() => handleUnfollow(seller.id)}
                    >
                      <i className="fas fa-user-minus"></i> Takibi Bırak
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
