// SellerProducts.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SellerProducts.css";

const SellerProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    console.log("Auth Check:", {
      hasToken: !!token,
      userType: userType,
    });

    if (!token || userType !== "SELLER") {
      setError("Bu sayfaya erişim yetkiniz yok");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    await Promise.all([fetchProducts(), fetchCategories()]);
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/v1/seller/products",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Fetched products:", response.data);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Products fetch error:", error);
      setError("Ürünler yüklenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/v1/categories"
      );
      console.log("Fetched categories:", response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Categories fetch error:", error);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:8080/api/v1/seller/products/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setProducts(products.filter((product) => product.id !== productId));
        alert("Ürün başarıyla silindi");
      } catch (error) {
        console.error("Delete error:", error);
        if (error.response?.status === 403) {
          alert("Bu ürünü silme yetkiniz bulunmuyor");
        } else {
          alert("Ürün silinirken bir hata oluştu");
        }
      }
    }
  };

  const handleEdit = (product) => {
    console.log("Editing product:", product);
    setSelectedProduct(product);
    setEditFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status,
      categoryId: product.category.id,
      type: product.type || "FOOD",
      shippingDetails: product.shippingDetails,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");

      if (!token || userType !== "SELLER") {
        throw new Error("Yetkilendirme hatası");
      }

      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        price: parseFloat(editFormData.price),
        stock: parseInt(editFormData.stock),
        status: editFormData.status,
        categoryId: parseInt(editFormData.categoryId),
        type: editFormData.type,
        shippingDetails: editFormData.shippingDetails,
      };

      const response = await axios.put(
        `http://localhost:8080/api/v1/seller/products/${selectedProduct.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Modal'ı kapat
      setShowEditModal(false);
      setSelectedProduct(null);

      // Ürünleri yeniden yükle
      await fetchProducts();
    } catch (error) {
      console.error("Update error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers,
      });

      if (error.response?.status === 403) {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        alert("Bu ürünü düzenleme yetkiniz bulunmuyor.");
      } else {
        alert(
          error.response?.data?.message || "Ürün güncellenirken bir hata oluştu"
        );
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(productSearchTerm.toLowerCase());
    const matchesCategory =
      productCategoryFilter === "ALL" ||
      product.category.id.toString() === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="seller-products-container">
      <div className="seller-products-header">
        <h2>Ürünlerim</h2>
        <button
          className="add-product-button"
          onClick={() => navigate("/add-product")}
        >
          Yeni Ürün Ekle
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Ürün ara..."
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

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          Henüz ürün eklenmemiş. Yeni ürün eklemek için "Yeni Ürün Ekle"
          butonuna tıklayın.
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img
                src={product.images[0]?.url || "/placeholder.png"}
                alt={product.title}
                className="product-image"
              />
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="price">{product.price} TL</p>
                <p className="stock">Stok: {product.stock}</p>
                <p className="status">Durum: {product.status}</p>
                <p className="category">Kategori: {product.category.name}</p>
              </div>
              <div className="product-actions">
                <button
                  onClick={() => handleEdit(product)}
                  className="edit-button"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="delete-button"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ürün Düzenle</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-form">
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
                <label>Açıklama</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Fiyat</label>
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
                <label>Durum</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value,
                    })
                  }
                  required
                >
                  <option value="AVAILABLE">Aktif</option>
                  <option value="INACTIVE">Pasif</option>
                  <option value="PENDING_REVIEW">Onay Bekliyor</option>
                  <option value="REJECTED">Reddedildi</option>
                </select>
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
                  value={editFormData.shippingDetails}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      shippingDetails: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                  }}
                  className="cancel-button"
                >
                  İptal
                </button>
                <button type="submit" className="save-button">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
