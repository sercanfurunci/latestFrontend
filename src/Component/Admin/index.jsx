import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Admin.css";

const Admin = () => {
  // Kullanıcı state'leri
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [userType, setUserType] = useState("ALL");

  // Ürün state'leri
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  // Bekleyen ürünler için state'ler
  const [pendingProducts, setPendingProducts] = useState([]);
  const [selectedPendingProduct, setSelectedPendingProduct] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Panel seçimi
  const [activePanel, setActivePanel] = useState("users");

  useEffect(() => {
    if (activePanel === "users") {
      fetchUsers();
    } else if (activePanel === "products") {
      fetchProducts();
      fetchCategories();
    } else if (activePanel === "pending") {
      fetchPendingProducts();
    }
    // eslint-disable-next-line
  }, [
    currentPage,
    userType,
    searchTerm,
    activePanel,
    productSearchTerm,
    productCategoryFilter,
  ]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      const response = await axios.get(
        `http://localhost:8080/api/v1/admin/users?page=${currentPage}&size=10&userType=${userType}&search=${searchTerm}&sort=id,asc`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError("Kullanıcılar yüklenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      const response = await axios.get(
        `http://localhost:8080/api/v1/admin/products?page=${currentPage}&size=10&category=${productCategoryFilter}&search=${productSearchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(response.data.content);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError("Ürünler yüklenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(
        "http://localhost:8080/api/v1/categories",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(response.data);
    } catch (err) {}
  };

  const fetchPendingProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      const response = await axios.get(
        "http://localhost:8080/api/v1/admin/products/pending",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const products = Array.isArray(response.data)
        ? response.data
        : response.data.content || [];
      setPendingProducts(products);
      setLoading(false);
    } catch (err) {
      setError("Bekleyen ürünler yüklenirken bir hata oluştu.");
      setLoading(false);
      setPendingProducts([]);
    }
  };

  const handleUserStatusChange = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await axios.put(
        `http://localhost:8080/api/v1/admin/users/${userId}/status`,
        {
          status: newStatus,
          reason:
            newStatus === "ACTIVE"
              ? "Hesap aktifleştirildi"
              : "Hesap pasifleştirildi",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchUsers();
    } catch (err) {
      setError("Kullanıcı durumu güncellenirken bir hata oluştu.");
    }
  };

  // SADECE ÜRÜN DURUMU GÜNCELLEME
  const handleProductStatusChange = async (productId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      await axios.put(
        `http://localhost:8080/api/v1/admin/products/${productId}/status`,
        {
          status: newStatus,
          message:
            newStatus === "AVAILABLE"
              ? "Ürün aktifleştirildi"
              : "Ürün pasifleştirildi",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      await fetchProducts();
      setSuccessMessage("Ürün durumu başarıyla güncellendi");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Ürün durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      await axios.delete(
        `http://localhost:8080/api/v1/admin/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchProducts();
      setSuccessMessage("Ürün başarıyla silindi");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Ürün silinirken bir hata oluştu.");
    }
  };

  const handleApprove = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      await axios.post(
        `http://localhost:8080/api/v1/admin/products/${productId}/approve`,
        { message: "Ürününüz başarıyla onaylandı" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setPendingProducts(pendingProducts.filter((p) => p.id !== productId));
      setShowPendingModal(false);
      setSelectedPendingProduct(null);
      setRejectionReason("");
      setSuccessMessage("Ürün başarıyla onaylandı");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Ürün onaylanırken bir hata oluştu.");
    }
  };

  const handleReject = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
        return;
      }
      await axios.post(
        `http://localhost:8080/api/v1/admin/products/${productId}/reject`,
        { message: rejectionReason || "Belirtilmedi" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setPendingProducts(pendingProducts.filter((p) => p.id !== productId));
      setShowPendingModal(false);
      setSelectedPendingProduct(null);
      setRejectionReason("");
      setSuccessMessage("Ürün başarıyla reddedildi");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Ürün reddedilirken bir hata oluştu.");
    }
  };

  const openPendingModal = (product) => {
    setSelectedPendingProduct(product);
    setShowPendingModal(true);
  };

  const closePendingModal = () => {
    setShowPendingModal(false);
    setSelectedPendingProduct(null);
    setRejectionReason("");
  };

  const handleSearch = (e) => {
    if (activePanel === "users") {
      setSearchTerm(e.target.value);
    } else {
      setProductSearchTerm(e.target.value);
    }
    setCurrentPage(0);
  };

  const handleFilterChange = (e) => {
    if (activePanel === "users") {
      setUserType(e.target.value);
    } else {
      setProductCategoryFilter(e.target.value);
    }
    setCurrentPage(0);
  };

  if (loading) return <div className="admin-loading">Yükleniyor...</div>;
  if (error) return <div className="admin-error-message">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Paneli</h2>
        <div className="admin-panel-selector">
          <select
            value={activePanel}
            onChange={(e) => setActivePanel(e.target.value)}
          >
            <option value="users">Kullanıcı Yönetimi</option>
            <option value="products">Ürün Yönetimi</option>
            <option value="pending">Bekleyen Ürünler</option>
          </select>
        </div>
      </div>

      <div className="admin-controls">
        <div className="admin-search-box">
          <input
            type="text"
            placeholder={
              activePanel === "users" ? "Kullanıcı ara..." : "Ürün ara..."
            }
            value={activePanel === "users" ? searchTerm : productSearchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="admin-filter-box">
          <select
            value={activePanel === "users" ? userType : productCategoryFilter}
            onChange={handleFilterChange}
          >
            <option value="ALL">
              {activePanel === "users" ? "Tüm Kullanıcılar" : "Tüm Kategoriler"}
            </option>
            {activePanel === "users" ? (
              <>
                <option value="BUYER">Alıcılar</option>
                <option value="SELLER">Satıcılar</option>
                <option value="ADMIN">Adminler</option>
              </>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {activePanel === "pending" ? (
        <div className="admin-pending-products">
          {loading ? (
            <div className="admin-loading">Yükleniyor...</div>
          ) : pendingProducts && pendingProducts.length > 0 ? (
            <div className="products-grid">
              {pendingProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? `http://localhost:8080${product.images[0]}`
                          : "/placeholder-image.jpg"
                      }
                      alt={product.title}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                    <span className="product-status-badge pending">
                      İncelemede
                    </span>
                  </div>
                  <div className="product-info">
                    <h3>{product.title}</h3>
                    <div className="seller-info">
                      Satıcı: {product.seller?.firstName}{" "}
                      {product.seller?.lastName}
                    </div>
                    <div className="price">{product.price} TL</div>
                    <div className="stock">Stok: {product.stock}</div>
                    <button
                      className="view-details-button"
                      onClick={() => openPendingModal(product)}
                    >
                      Detayları Görüntüle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">Bekleyen ürün bulunmamaktadır.</div>
          )}
        </div>
      ) : activePanel === "users" ? (
        <div className="admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Kullanıcı Tipi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.userType === "BUYER" && "Alıcı"}
                    {user.userType === "SELLER" && "Satıcı"}
                    {user.userType === "ADMIN" && "Admin"}
                  </td>
                  <td>
                    <span
                      className={`admin-status-badge ${
                        user.active
                          ? "admin-status-available"
                          : "admin-status-inactive"
                      }`}
                    >
                      {user.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={
                        user.active
                          ? "admin-deactivate-btn"
                          : "admin-activate-btn"
                      }
                      onClick={() =>
                        handleUserStatusChange(
                          user.id,
                          user.active ? "ACTIVE" : "INACTIVE"
                        )
                      }
                    >
                      {user.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-products-table">
          <table>
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Satıcı</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>
                    {product.seller.firstName} {product.seller.lastName}
                  </td>
                  <td>{product.category.name}</td>
                  <td>{product.price} TL</td>
                  <td>{product.stock}</td>
                  <td>
                    <span
                      className={`admin-status-badge ${
                        product.status === "AVAILABLE"
                          ? "admin-status-available"
                          : product.status === "INACTIVE"
                          ? "admin-status-inactive"
                          : product.status === "PENDING_REVIEW"
                          ? "admin-status-pending"
                          : product.status === "REJECTED"
                          ? "admin-status-rejected"
                          : "admin-status-removed"
                      }`}
                    >
                      {product.status === "AVAILABLE" && "Aktif"}
                      {product.status === "INACTIVE" && "Pasif"}
                      {product.status === "PENDING_REVIEW" && "Onay Bekliyor"}
                      {product.status === "REJECTED" && "Reddedildi"}
                      {product.status === "REMOVED" && "Silindi"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-edit-btn"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      className="admin-delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="admin-edit-form-overlay">
          <div className="admin-edit-form">
            <h3>Ürün Durumunu Düzenle</h3>
            <div className="admin-form-group">
              <label>Durum</label>
              <select
                value={editStatus || selectedProduct.status}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="AVAILABLE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
                <option value="REJECTED">Reddedildi</option>
              </select>
            </div>
            <div className="admin-form-buttons">
              <button
                onClick={async () => {
                  await handleProductStatusChange(
                    selectedProduct.id,
                    editStatus || selectedProduct.status
                  );
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  setEditStatus("");
                }}
              >
                Kaydet
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  setEditStatus("");
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingModal && selectedPendingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedPendingProduct.title}</h2>
              <button className="close-button" onClick={closePendingModal}>
                &times;
              </button>
            </div>
            <div className="product-details">
              <div className="product-images">
                {selectedPendingProduct.images &&
                  selectedPendingProduct.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:8080${image}`}
                      alt={`${selectedPendingProduct.title} - ${index + 1}`}
                      className="detail-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  ))}
              </div>
              <div className="product-info-details">
                <div className="description">
                  <h4>Ürün Açıklaması</h4>
                  <p>{selectedPendingProduct.description}</p>
                </div>
                <div className="seller-details">
                  <h4>Satıcı Bilgileri</h4>
                  <p>
                    İsim: {selectedPendingProduct.seller.firstName}{" "}
                    {selectedPendingProduct.seller.lastName}
                  </p>
                  <p>E-posta: {selectedPendingProduct.seller.email}</p>
                  <p>
                    Telefon:{" "}
                    {selectedPendingProduct.seller.phoneNumber ||
                      "Belirtilmemiş"}
                  </p>
                </div>
                <div className="product-specs">
                  <h4>Ürün Özellikleri</h4>
                  <p>Fiyat: {selectedPendingProduct.price} TL</p>
                  <p>Stok: {selectedPendingProduct.stock}</p>
                  <p>Kategori: {selectedPendingProduct.category.name}</p>
                </div>
                <div className="rejection-reason">
                  <label htmlFor="rejectionReason">
                    Red Nedeni (Opsiyonel):
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ürünü reddetme nedeninizi yazın..."
                    rows="4"
                  />
                </div>
                <div className="action-buttons">
                  <button
                    className="approve-button"
                    onClick={() => handleApprove(selectedPendingProduct.id)}
                  >
                    Onayla
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleReject(selectedPendingProduct.id)}
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="admin-success-message">{successMessage}</div>
      )}

      <div className="admin-pagination">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Önceki
        </button>
        <span>
          Sayfa {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
};

export default Admin;
