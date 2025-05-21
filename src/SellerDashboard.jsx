import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SellerDashboard.css";
import api from "./utils/axios";

const SellerDashboard = () => {
  const navigate = useNavigate();
  // Profil state'leri
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });

  // Ürün state'leri
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const [suggesting, setSuggesting] = useState(false);
  const [editImages, setEditImages] = useState([]);

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    status: "",
    categoryId: "",
    type: "FOOD",
    shippingDetails: "",
  });

  // Yeni ürün ekleme state'leri
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    shippingDetails: "",
    images: [],
  });

  const [loading, setLoading] = useState(true);

  // Sekme yönetimi ve orders
  const [activeTab, setActiveTab] = useState("products");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // handleEditSubmit fonksiyonu
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...editFormData,
        price: parseFloat(editFormData.price),
        stock: parseInt(editFormData.stock),
        categoryId: parseInt(editFormData.categoryId),
      };
      const response = await api.put(
        `/api/v1/seller/products/${selectedProduct.id}`,
        updateData
      );
      if (editImages.length > 0) {
        try {
          await api.delete(
            `/api/v1/seller/products/${selectedProduct.id}/images`
          );
          const imageFormData = new FormData();
          editImages.forEach((img) => imageFormData.append("images", img));
          await api.post(
            `/api/v1/seller/products/${selectedProduct.id}/images`,
            imageFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } catch (imageError) {
          setError(
            "Ürün güncellendi fakat görseller yüklenirken hata oluştu: " +
              (imageError.response?.data || imageError.message)
          );
        }
      }
      setProducts(
        products.map((product) =>
          product.id === selectedProduct.id ? response.data : product
        )
      );
      await fetchProducts();
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditImages([]);
      setSuggestedPrice(null);
      setSuggesting(false);
      setInfo(
        "Ürün başarıyla güncellendi. Önemli değişiklikler yapıldıysa admin onayına gönderilecektir."
      );
    } catch (error) {
      setError(
        "Ürün güncellenirken bir hata oluştu: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // handleEdit fonksiyonu
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status || "PENDING_REVIEW",
      categoryId: product.category?.id || "",
      type: product.type || "FOOD",
      shippingDetails: product.shippingDetails || "",
    });
    setEditImages([]);
    setShowEditModal(true);
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (user && user.userType === "SELLER") {
      fetchFollowers();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    if (!token || userType !== "SELLER") {
      setError("Bu sayfaya erişim yetkiniz yok");
      return;
    }
    try {
      await Promise.all([fetchProfile(), fetchProducts(), fetchCategories()]);
    } catch (error) {
      console.error("Veri yüklenirken hata:", error);
      if (error.response?.status === 403) {
        localStorage.removeItem("token");
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
      }
    }
  };

  const fetchProfile = async () => {
    try {
      const meResponse = await api.get("/api/v1/auth/me");
      const response = await api.get(`/api/v1/users/${meResponse.data.id}`);
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
      console.error("Profil bilgileri yüklenirken hata:", error);
      setError("Profil bilgileri yüklenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/api/v1/seller/products?sortBy=newest`);
      setProducts(response.data);
    } catch (err) {
      setError("Ürünler yüklenirken hata oluştu: " + err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/v1/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Categories fetch error:", error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await api.get("/api/v1/seller/followers");
      setFollowers(response.data);
    } catch (error) {
      console.error("Takipçiler yüklenirken hata:", error);
      setFollowers([]);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      const res = await axios.get(
        "http://localhost:8080/api/v1/seller/orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data);
    } catch (err) {
      setOrdersError("Satışlar alınamadı.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/v1/users/${user.id}`, formData);
      setUser(response.data);
      setShowProfileEditModal(false);
      setInfo("Profil başarıyla güncellendi.");
    } catch (err) {
      console.error("Profil güncellenirken hata:", err);
      setError("Profil güncellenirken bir hata oluştu.");
    }
  };

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false);
    setError(null);
    setSuggestedPrice(null);
    setSuggesting(false);
    setNewProduct({
      title: "",
      description: "",
      price: "",
      stock: "",
      categoryId: "",
      shippingDetails: "",
      images: [],
    });
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      try {
        await api.delete(`/api/v1/seller/products/${productId}`);
        setProducts(products.filter((product) => product.id !== productId));
        setInfo("Ürün başarıyla silindi.");
      } catch (error) {
        setError("Ürün silinirken bir hata oluştu: " + error.message);
      }
    }
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (newProduct.description.length < 10) {
      setError("Ürün açıklaması en az 10 karakter olmalıdır!");
      return;
    }
    try {
      const productData = {
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        categoryId: parseInt(newProduct.categoryId),
        type: "FOOD",
        images: [],
        tags: [],
        ingredients: "",
        preparationTime: "",
        shippingDetails: newProduct.shippingDetails,
      };
      const response = await api.post("/api/v1/seller/products", productData);
      if (response.data && newProduct.images.length > 0) {
        const productId = response.data.id;
        const imageFormData = new FormData();
        newProduct.images.forEach((image) => {
          imageFormData.append("images", image);
        });
        try {
          await api.post(
            `/api/v1/seller/products/${productId}/images`,
            imageFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } catch (imageError) {
          setError(
            "Ürün oluşturuldu fakat resimler yüklenirken bir hata oluştu: " +
              (imageError.response?.data || imageError.message)
          );
        }
      }
      await fetchProducts();
      setShowAddProductModal(false);
      setNewProduct({
        title: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        shippingDetails: "",
        images: [],
      });
      setInfo(
        "Ürününüz admin onayına gönderildi. Onaylandıktan sonra satışa açılacaktır."
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "Ürün eklenirken bir hata oluştu."
      );
    }
  };

  // Yapay zeka fiyat önerisi
  const handleSuggestPrice = async () => {
    setSuggesting(true);
    setSuggestedPrice(null);
    try {
      const response = await api.post("/api/v1/ai/price-suggestion", {
        title: newProduct.title,
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        stock: newProduct.stock,
      });
      setSuggestedPrice(response.data.suggestedPrice);
    } catch (error) {
      setError(error.response?.data?.error || "Fiyat önerisi alınamadı.");
    }
    setSuggesting(false);
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">Kullanıcı bulunamadı.</div>;

  const filteredProducts = products.filter((product) => {
    const productTitle = (product.title || product.name || "").toString();
    const matchesSearch = productTitle
      .toLowerCase()
      .includes((productSearchTerm || "").toLowerCase());
    const matchesCategory =
      productCategoryFilter === "ALL" ||
      (product.category &&
        product.category.id &&
        product.category.id.toString() === productCategoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="seller-dashboard">
      {/* Bilgi ve Hata Mesajları */}
      {info && <div className="info-message">{info}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Profil Başlık Bölümü */}
      <div className="profile-header">
        <div className="profile-info-container">
          <div className="profile-image-wrapper">
            <img
              src={
                user.profilePicture
                  ? `http://localhost:8080/profiles/${user.profilePicture}`
                  : "/default-avatar.png"
              }
              alt="Profil"
              className="profile-image"
            />
          </div>
          <div className="profile-details">
            <div className="profile-name-container">
              <h2>
                {user.firstName} {user.lastName}
              </h2>
              <span className="seller-badge">Satıcı</span>
            </div>
            {user.bio && <div className="profile-bio">{user.bio}</div>}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{products.length}</span>
                <span className="stat-label">Ürün</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.followerCount || 0}</span>
                <span className="stat-label">Takipçi</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {user.sellerRating ? user.sellerRating.toFixed(1) : "0.0"}
                </span>
                <span className="stat-label">Puan</span>
              </div>
            </div>
            <button
              className="edit-profile-button"
              onClick={() => setShowProfileEditModal(true)}
            >
              <i className="fas fa-edit"></i> Profili Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="profile-tabs">
        <div
          className={`tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Ürünlerim ({products.length})
        </div>
        <div
          className={`tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Satışlarım
        </div>
        <div
          className={`tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          Favoriler (0)
        </div>
        {user && user.userType === "SELLER" && (
          <div
            className={`tab ${activeTab === "followers" ? "active" : ""}`}
            onClick={() => setActiveTab("followers")}
          >
            Takipçilerim ({followers.length})
          </div>
        )}
      </div>

      {/* Filtreler ve Ürünler */}
      {activeTab === "products" && (
        <>
          <div className="filters-container">
            <div className="search-filters">
              <input
                type="text"
                placeholder="Ürünlerimde ara..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="category-select"
              >
                <option value="ALL">Tüm Kategoriler</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-image-container">
                  <img
                    src={
                      product.images && product.images[0]
                        ? `http://localhost:8080${product.images[0]}`
                        : "/placeholder.png"
                    }
                    alt={product.title || product.name || "Ürün"}
                    className="product-image"
                  />
                  <div className="product-status-badge">
                    {product.status === "AVAILABLE" && "Satışta"}
                    {product.status === "SOLD" && "Satıldı"}
                    {product.status === "PENDING_REVIEW" &&
                      "İncelemede (Admin Onayı Bekliyor)"}
                    {product.status === "REJECTED" && "Reddedildi"}
                  </div>
                </div>
                <div className="product-info">
                  <h3 style={{ fontSize: "1rem" }} className="product-title">
                    {product.title || product.name}
                  </h3>
                  <div className="product-category">
                    {product.category && product.category.name
                      ? product.category.name
                      : ""}
                  </div>
                  <div className="product-price">{product.price} TL</div>
                  <div className="product-stock">Stok: {product.stock}</div>
                </div>
                <div className="product-actions">
                  <button
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(product);
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="add-product-button"
            onClick={() => setShowAddProductModal(true)}
          >
            <i className="fas fa-plus"></i> Yeni Ürün Ekle
          </button>
        </>
      )}

      {/* Takipçilerim Sekmesi */}
      {activeTab === "followers" && (
        <div className="followers-container">
          {followers.length === 0 ? (
            <div>Henüz takipçiniz yok.</div>
          ) : (
            <ul className="followers-list">
              {followers.map((f) => (
                <li
                  key={f.id}
                  className="follower-item"
                  onClick={() => navigate(`/buyer/${f.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      window.location.href = `/profile/${f.id}`;
                  }}
                  title={`${f.firstName} ${f.lastName} profiline git`}
                >
                  <img
                    src={
                      f.profilePicture
                        ? `http://localhost:8080/profiles/${f.profilePicture}`
                        : "/default-avatar.png"
                    }
                    alt={f.firstName}
                    className="follower-avatar"
                  />
                  <span className="follower-info">
                    <span className="follower-name">
                      {f.firstName} {f.lastName}
                    </span>
                    <span className="follower-email">({f.email})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Satışlarım Sekmesi */}
      {activeTab === "orders" && (
        <div className="seller-orders-container">
          <h1 className="seller-orders-title">Satışlarım</h1>
          {ordersLoading ? (
            <div>Yükleniyor...</div>
          ) : ordersError ? (
            <div>{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="seller-orders-empty">Henüz bir satışınız yok.</div>
          ) : (
            <div className="seller-orders-list">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="seller-order-item"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="seller-order-row">
                    <span className="seller-order-label">Sipariş No:</span>
                    <span className="seller-order-value">{order.id}</span>
                  </div>
                  <div className="seller-order-row">
                    <span className="seller-order-label">Ürün:</span>
                    <span className="seller-order-value">
                      {order.product?.title}
                    </span>
                  </div>
                  <div className="seller-order-row">
                    <span className="seller-order-label">Fiyat:</span>
                    <span className="seller-order-value">
                      {order.finalPrice} TL
                    </span>
                  </div>
                  <div className="seller-order-row">
                    <span className="seller-order-label">Durum:</span>
                    <span className={`seller-order-status ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="seller-order-row">
                    <span className="seller-order-label">Kargo Takip No:</span>
                    <span className="seller-order-value">
                      {order.trackingNumber || "Henüz yok"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profil Düzenleme Modal */}
      {showProfileEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Profili Düzenle</h3>
              <button
                className="close-button"
                onClick={() => setShowProfileEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Ad:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Soyad:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>E-posta:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Telefon:</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Biyografi:</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleProfileChange}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Kaydet
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowProfileEditModal(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ürün Ekleme Modal */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={handleCloseAddProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Ürün Ekle</h2>
            <form onSubmit={handleNewProductSubmit}>
              <div className="form-group">
                <label>Ürün Adı</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Ürün Açıklaması ({newProduct.description.length} karakter -
                  minimum 10 karakter)
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  required
                  minLength={10}
                  className={
                    newProduct.description.length > 0 &&
                    newProduct.description.length < 10
                      ? "invalid"
                      : ""
                  }
                />
                {newProduct.description.length > 0 &&
                  newProduct.description.length < 10 && (
                    <small className="error-text">
                      Ürün açıklaması en az 10 karakter olmalıdır.
                      {10 - newProduct.description.length} karakter daha
                      yazmalısınız.
                    </small>
                  )}
              </div>
              <div className="form-group">
                <label>Fiyat (TL)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: e.target.value,
                    })
                  }
                  required
                  min="0"
                  step="0.01"
                />
                <div className="price-suggestion-container">
                  <button
                    type="button"
                    className="suggest-price-button"
                    onClick={handleSuggestPrice}
                    disabled={
                      suggesting ||
                      !newProduct.title ||
                      !newProduct.description ||
                      !newProduct.categoryId
                    }
                  >
                    <i className="fas fa-magic"></i>
                    {suggesting ? "Öneriliyor..." : "Fiyat Öner"}
                  </button>
                </div>
                {suggestedPrice && (
                  <div className="suggested-price">
                    <strong>Yapay Zeka Fiyat Önerisi:</strong> {suggestedPrice}{" "}
                    TL
                    <button
                      type="button"
                      className="apply-price-button"
                      onClick={() =>
                        setNewProduct({ ...newProduct, price: suggestedPrice })
                      }
                    >
                      <i className="fas fa-check"></i> Uygula
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Stok</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: e.target.value,
                    })
                  }
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      categoryId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kargo Detayları</label>
                <textarea
                  value={newProduct.shippingDetails}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      shippingDetails: e.target.value,
                    })
                  }
                  rows="2"
                  placeholder="Kargo bilgilerini giriniz"
                />
              </div>
              <div className="form-group">
                <label>Ürün Görseli</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  multiple
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      images: Array.from(e.target.files),
                    })
                  }
                />
                <small className="help-text">
                  Desteklenen formatlar: JPG, JPEG, PNG, GIF. Maksimum dosya
                  boyutu: 5MB
                </small>
                <div className="image-preview">
                  {newProduct.images.length > 0 &&
                    newProduct.images.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt={`Yeni Görsel ${idx + 1}`}
                        style={{
                          maxWidth: 80,
                          maxHeight: 80,
                          objectFit: "cover",
                          marginRight: 8,
                        }}
                      />
                    ))}
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  Ekle
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCloseAddProductModal}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ürün Düzenleme Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ürünü Düzenle</h3>
              <button
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Ürün Adı</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Ürün Açıklaması</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  required
                  minLength={10}
                />
              </div>
              <div className="form-group">
                <label>Fiyat (TL)</label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      price: e.target.value,
                    })
                  }
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Stok</label>
                <input
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      stock: e.target.value,
                    })
                  }
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      categoryId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Durum</label>
                <input
                  type="text"
                  value={
                    editFormData.status === "AVAILABLE"
                      ? "Satışta"
                      : editFormData.status === "PENDING_REVIEW"
                      ? "İncelemede (Admin Onayı Bekliyor)"
                      : editFormData.status === "REJECTED"
                      ? "Reddedildi"
                      : editFormData.status
                  }
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Kargo Detayları</label>
                <textarea
                  value={editFormData.shippingDetails}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      shippingDetails: e.target.value,
                    })
                  }
                  rows="2"
                  placeholder="Kargo bilgilerini giriniz"
                />
              </div>
              <div className="form-group">
                <label>Ürün Görseli</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) =>
                    setEditImages(e.target.files[0] ? [e.target.files[0]] : [])
                  }
                />
                <small className="help-text">
                  Desteklenen formatlar: JPG, JPEG, PNG, GIF. Maksimum dosya
                  boyutu: 5MB
                </small>
                <div className="image-preview">
                  {selectedProduct.images &&
                    selectedProduct.images.length > 0 &&
                    editImages.length === 0 && (
                      <img
                        src={`http://localhost:8080${selectedProduct.images[0]}`}
                        alt="Mevcut Görsel"
                        style={{
                          maxWidth: 80,
                          maxHeight: 80,
                          objectFit: "cover",
                          marginRight: 8,
                        }}
                      />
                    )}
                  {editImages.length > 0 && (
                    <img
                      src={URL.createObjectURL(editImages[0])}
                      alt="Yeni Görsel"
                      style={{
                        maxWidth: 80,
                        maxHeight: 80,
                        objectFit: "cover",
                        marginRight: 8,
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  Kaydet
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
