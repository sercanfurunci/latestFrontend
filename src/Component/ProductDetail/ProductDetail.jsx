import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaStar,
  FaTrash,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBoxOpen,
  FaTag,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaPaperPlane,
  FaShoppingCart,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetail.css";

const API_URL = "http://localhost:8080";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [editingReply, setEditingReply] = useState(null);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [hasAcceptedOffer, setHasAcceptedOffer] = useState(false);

  //product edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    shippingDetails: "",
  });
  // urun sahipligi
  const isProductOwner =
    isLoggedIn &&
    userType === "SELLER" &&
    product &&
    product.seller &&
    userEmail === product.seller.email;
  console.log(isProductOwner);
  // OFFER STATE
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);

  const fetchProduct = async () => {
    const token = localStorage.getItem("token");
    if (!id) {
      setError("Ürün ID'si bulunamadı");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/v1/products/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProduct(response.data);
    } catch (error) {
      setError("Ürün yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log("localStorage userType:", localStorage.getItem("userType"));
    console.log("localStorage token:", localStorage.getItem("token"));
    console.log("offers:", offers);
    console.log("userType:", userType);
    console.log("userEmail:", userEmail);
    console.log(
      "Kendi teklifim var mı?",
      offers.some((o) => o.buyer?.email === userEmail)
    );
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("userType");
    const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const email = payload?.sub;
    setIsLoggedIn(!!token);
    setUserType(type || "");
    setUserEmail(email || "");
    fetchProduct();

    const fetchComments = async () => {
      if (!id) return;
      try {
        const response = await axios.get(
          `${API_URL}/api/v1/buyer/comments/product/${id}`
        );
        setComments(response.data);
      } catch (error) {}
    };

    // Teklifleri çek (sadece seller ise veya buyer kendi teklifini görmek isterse)
    const fetchOffers = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        if (type === "SELLER") {
          // Satıcı, ürününe gelen teklifleri görebilir
          const response = await axios.get(
            `${API_URL}/api/v1/seller/offers/product/${id}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          setOffers(response.data);
        } else if (type === "BUYER") {
          // Alıcı, kendi tekliflerini görebilir
          const response = await axios.get(
            `${API_URL}/api/v1/buyer/offers/my-offers`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const productOffers = response.data.filter((o) => o.product.id == id);
          setOffers(productOffers);
          // Kabul edilmiş teklif kontrolü
          const userAcceptedOffer = productOffers.find(
            (offer) => offer.product.id == id && offer.status === "ACCEPTED"
          );
          setHasAcceptedOffer(!!userAcceptedOffer);
        }
      } catch (error) {
        setOffers([]);
        setHasAcceptedOffer(false);
      }
    };

    fetchProduct();
    fetchComments();
    fetchOffers();
    // eslint-disable-next-line
  }, [id]);

  // TEKLİF GÖNDERME
  const handleSendOffer = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const type = localStorage.getItem("userType");
    console.log("Token:", token);
    console.log("Type:", type);
    if (!isLoggedIn) {
      alert("Teklif vermek için giriş yapmalısınız");
      return;
    }
    if (!offerAmount || offerAmount <= 0) {
      alert("Geçerli bir teklif tutarı girin");
      return;
    }
    setOfferLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/v1/buyer/offers`,
        {
          productId: id,
          offerAmount: offerAmount,
          message: offerMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          "Content-Type": "application/json",
        }
      );
      alert("Teklifiniz gönderildi!");
      setOfferAmount("");
      setOfferMessage("");
      // Teklifleri tekrar çek
      if (userType === "BUYER" || userType === "SELLER") {
        const fetchOffers = async () => {
          if (userType === "SELLER") {
            const response = await axios.get(
              `${API_URL}/api/v1/seller/offers/product/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setOffers(response.data);
          } else if (userType === "BUYER") {
            const response = await axios.get(
              `${API_URL}/api/v1/buyer/offers/my-offers`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setOffers(response.data.filter((o) => o.product.id == id));
          }
        };
        fetchOffers();
      }
    } catch (error) {
      alert(
        error.response?.data?.message || "Teklif gönderilirken bir hata oluştu"
      );
    }
    setOfferLoading(false);
  };

  //edit product
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/v1/seller/products/${product.id}`,
        {
          ...editFormData,
          price: parseFloat(editFormData.price),
          stock: parseInt(editFormData.stock),
          categoryId: parseInt(editFormData.categoryId),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProduct();
      // Bildirim göster
      alert(
        "Ürün başarıyla güncellendi ve admin onayına gönderildi. Bilgilendirildiniz!"
      );
      setShowEditModal(false);
      // Anasayfaya yönlendir
      navigate("/");
    } catch (error) {
      alert("Ürün güncellenirken hata oluştu: " + error.message);
    }
  };

  //comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Yorum yapabilmek için giriş yapmalısınız");
      return;
    }
    if (!newComment.trim()) {
      alert("Lütfen bir yorum yazın");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/v1/buyer/comments`,
        {
          productId: id,
          content: newComment,
          rating: rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setComments([response.data, ...comments]);
      setNewComment("");
      setRating(5);
    } catch (error) {
      alert(
        error.response?.data?.message || "Yorum eklenirken bir hata oluştu"
      );
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyText[commentId]?.trim()) {
      alert("Lütfen bir yanıt yazın");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/v1/buyer/comments/${commentId}/reply`,
        { reply: replyText[commentId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? response.data : comment
        )
      );
      setReplyText({ ...replyText, [commentId]: "" });
      setEditingReply(null);
    } catch (error) {
      alert(
        error.response?.data?.message || "Yanıt eklenirken bir hata oluştu"
      );
    }
  };

  const handleEditReply = async (commentId) => {
    if (!replyText[commentId]?.trim()) {
      alert("Lütfen bir yanıt yazın");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/v1/buyer/comments/${commentId}/reply`,
        { reply: replyText[commentId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? response.data : comment
        )
      );
      setReplyText({ ...replyText, [commentId]: "" });
      setEditingReply(null);
    } catch (error) {
      alert(
        error.response?.data?.message || "Yanıt güncellenirken bir hata oluştu"
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/v1/buyer/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      alert(
        error.response?.data?.message || "Yorum silinirken bir hata oluştu"
      );
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Ürün bulunamadı</div>;

  const isSellerOfProduct = userType === "SELLER";
  const statusBadge = {
    AVAILABLE: { text: "Satışta", color: "#4caf50", icon: <FaCheckCircle /> },
    SOLD: { text: "Satıldı", color: "#e44d26", icon: <FaTimesCircle /> },
    PENDING_REVIEW: { text: "İncelemede", color: "#ff9800", icon: <FaClock /> },
    INACTIVE: { text: "Pasif", color: "#aaa", icon: <FaTimesCircle /> },
    REJECTED: { text: "Reddedildi", color: "#b71c1c", icon: <FaTimesCircle /> },
  }[product.status] || { text: product.status, color: "#666" };

  // TEKLİF LİSTELEME
  const renderOffers = () => {
    if (!offers || offers.length === 0) {
      return (
        <p>
          Ürününe teklifler mevcut. Elini çabuk tut ve sen de bir tane gönder.
        </p>
      );
    }
    const getStatusText = (status) => {
      switch (status) {
        case "PENDING":
          return "Beklemede";
        case "ACCEPTED":
          return "Kabul Edildi";
        case "REJECTED":
          return "Reddedildi";
        case "CANCELLED":
          return "İptal Edildi";
        default:
          return status;
      }
    };

    return (
      <ul className="offer-list">
        {offers.map((offer) => {
          // Sadece satıcı veya teklifin sahibi görebilsin
          const isOfferOwner = userEmail === offer.buyer?.email;
          if (userType === "SELLER" || (userType === "BUYER" && isOfferOwner)) {
            return (
              <li key={offer.id} className="offer-item">
                {/* Teklif göndereni sadece satıcı ve teklif sahibi görebilir */}
                {userType === "SELLER" && offer.buyer && (
                  <span className="offer-buyer">
                    <FaUser /> {offer.buyer.firstName} {offer.buyer.lastName}
                  </span>
                )}
                <span>
                  <FaMoneyBillWave /> <b>{offer.offerAmount} TL</b>
                </span>
                {offer.message && (
                  <span className="offer-message">"{offer.message}"</span>
                )}
                <span className={`offer-status offer-status-${offer.status}`}>
                  {getStatusText(offer.status)}
                </span>
                <button
                  style={{
                    marginLeft: 8,
                    background: "#eee",
                    color: "#222",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/offers/${offer.id}`)}
                >
                  Detaya Git
                </button>
                {/* Alıcı için iptal */}
                {userType === "BUYER" && offer.status === "PENDING" && (
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Teklifinizi iptal etmek istiyor musunuz?"
                        )
                      ) {
                        try {
                          const token = localStorage.getItem("token");
                          await axios.post(
                            `${API_URL}/api/v1/buyer/offers/${offer.id}/cancel`,
                            {},
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          setOffers(offers.filter((o) => o.id !== offer.id));
                        } catch (error) {
                          alert(
                            error.response?.data?.message ||
                              "Teklif iptal edilirken hata oluştu"
                          );
                        }
                      }
                    }}
                  >
                    İptal Et
                  </button>
                )}
                {/* Satıcı için onayla/reddet */}
                {userType === "SELLER" && offer.status === "PENDING" && (
                  <>
                    <button
                      style={{
                        marginLeft: 8,
                        background: "#4caf50",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 12px",
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          await axios.post(
                            `${API_URL}/api/v1/seller/offers/${offer.id}/accept`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          // Teklifleri tekrar çek
                          const response = await axios.get(
                            `${API_URL}/api/v1/seller/offers/product/${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          setOffers(response.data);
                        } catch (error) {
                          alert("Onaylanamadı!");
                        }
                      }}
                    >
                      Onayla
                    </button>
                    <button
                      style={{
                        marginLeft: 8,
                        background: "#e44d26",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 12px",
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          await axios.post(
                            `${API_URL}/api/v1/seller/offers/${offer.id}/reject`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          // Teklifleri tekrar çek
                          const response = await axios.get(
                            `${API_URL}/api/v1/seller/offers/product/${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          setOffers(response.data);
                        } catch (error) {
                          alert("Reddedilemedi!");
                        }
                      }}
                    >
                      Reddet
                    </button>
                  </>
                )}
              </li>
            );
          }
          // Diğer kullanıcıların teklifleri görünmesin
          return null;
        })}
      </ul>
    );
  };
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert("Sepete eklemek için giriş yapmalısınız");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/v1/cart/add`,
        {
          productId: id,
          quantity: 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Ürün sepete eklendi!");
    } catch (error) {
      alert("Ürün sepete eklenirken bir hata oluştu");
    }
  };

  return (
    <div className="product-detail">
      <div className="product-header">
        <h1>{product.title || product.name}</h1>
        <div className="product-meta">
          <span className="price">{product.price} TL</span>
          <span className="category">
            <FaBoxOpen /> {product.category?.name}
          </span>
          <span className="stock">
            <FaBoxOpen /> Stok: {product.stock}
          </span>
          <span
            className="status-badge"
            style={{
              background: statusBadge.color,
              color: "#fff",
              borderRadius: 16,
              padding: "2px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {statusBadge.icon} {statusBadge.text}
          </span>
        </div>
      </div>

      <div className="product-content">
        <div className="product-images">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={`${API_URL}${product.images[mainImageIdx]}`}
                alt={product.title}
                className="main-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
              {product.images.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${API_URL}${img}`}
                      alt={`thumb-${idx}`}
                      className={`thumbnail${
                        mainImageIdx === idx ? " selected" : ""
                      }`}
                      onClick={() => setMainImageIdx(idx)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-image">Resim yok</div>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="product-tags">
              {product.tags.map((tag, idx) => (
                <span className="tag" key={idx}>
                  <FaTag /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-description">
            <h2>Ürün Açıklaması</h2>
            <p>{product.description}</p>
          </div>

          {product.shippingDetails && (
            <div className="product-shipping">
              <h2>Kargo Detayları</h2>
              <p>{product.shippingDetails}</p>
            </div>
          )}

          {product.ingredients && (
            <div className="product-ingredients">
              <h2>İçindekiler</h2>
              <p>{product.ingredients}</p>
            </div>
          )}

          {product.preparationTime && (
            <div className="product-preparation">
              <h2>Hazırlama Süresi</h2>
              <p>{product.preparationTime}</p>
            </div>
          )}

          <div className="seller-info">
            <h2>Satıcı Bilgileri</h2>
            <div className="seller-profile">
              <img
                src={
                  product.seller?.profilePicture
                    ? `http://localhost:8080/profiles/${product.seller.profilePicture}`
                    : "/default-avatar.png"
                }
                alt={`${product.seller?.firstName} ${product.seller?.lastName}`}
                className="seller-avatar"
                onClick={() => navigate(`/seller/${product.seller.id}`)}
                style={{ cursor: "pointer" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-avatar.png";
                }}
              />
              <div className="seller-details">
                <h3
                  className="seller-name"
                  onClick={() => navigate(`/seller/${product.seller.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {product.seller?.firstName} {product.seller?.lastName}
                </h3>
                <p className="seller-bio">{product.seller?.bio}</p>
                <div className="seller-contact">
                  <span>
                    <FaPhone /> {product.seller?.phoneNumber}
                  </span>
                  <span>
                    <FaEnvelope /> {product.seller?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ürün sahibi ise ürün düzenleme */}
      {isProductOwner && (
        <button
          className="edit-product-button"
          onClick={() => {
            setEditFormData({
              title: product.title,
              description: product.description,
              price: product.price,
              stock: product.stock,
              categoryId: product.category?.id || "",
              shippingDetails: product.shippingDetails || "",
            });
            setShowEditModal(true);
          }}
        >
          Ürünü Düzenle
        </button>
      )}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Ürünü Düzenle</h3>
            <form onSubmit={handleEditSubmit}>
              <label>Ürün Adı</label>
              <input
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                required
              />

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
              />

              <label>Fiyat (TL)</label>
              <input
                type="number"
                value={editFormData.price}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, price: e.target.value })
                }
                required
              />

              <label>Stok</label>
              <input
                type="number"
                value={editFormData.stock}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, stock: e.target.value })
                }
                required
              />

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

              {/* Kategori seçimi ve diğer alanlar */}
              <button type="submit">Kaydet</button>
              <button type="button" onClick={() => setShowEditModal(false)}>
                İptal
              </button>
            </form>
          </div>
        </div>
      )}
      {/* TEKLİF FORMU ve TEKLİFLER */}

      <div className="offers-section">
        <h2>Teklifler</h2>
        {offers.length > 0 &&
          userType !== "SELLER" &&
          !offers.some((o) => o.buyer?.email === userEmail) && (
            <div className="offer-warning">
              Bu ürüne teklifler var, elini çabuk tut!
            </div>
          )}
        {isLoggedIn && userType === "BUYER" && (
          <form onSubmit={handleSendOffer} className="offer-form">
            <div>
              <label>
                Teklif Tutarı (TL):
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                  disabled={offerLoading}
                />
              </label>
            </div>
            <div>
              <label>
                Mesaj (isteğe bağlı):
                <input
                  type="text"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  maxLength={255}
                  disabled={offerLoading}
                />
              </label>
            </div>
            <button type="submit" disabled={offerLoading}>
              <FaPaperPlane /> Teklif Gönder
            </button>
          </form>
        )}
        <div className="offers-list">{renderOffers()}</div>
      </div>

      <div className="product-actions">
        {isLoggedIn && userType === "BUYER" && hasAcceptedOffer && (
          <button onClick={handleAddToCart}>
            <FaShoppingCart /> Sepete Ekle
          </button>
        )}
      </div>
      <div className="product-extra-info">
        <h2>Ürün Detayları</h2>
        <ul>
          <li>
            <strong>Fiyat:</strong> {product.price} TL
          </li>
          <li>
            <strong>Stok:</strong> {product.stock}
          </li>
          <li>
            <strong>Kategori:</strong> {product.category?.name}
          </li>
          {product.shippingDetails && (
            <li>
              <strong>Kargo Detayları:</strong> {product.shippingDetails}
            </li>
          )}
          {product.ingredients && (
            <li>
              <strong>İçindekiler:</strong> {product.ingredients}
            </li>
          )}
          {product.preparationTime && (
            <li>
              <strong>Hazırlama Süresi:</strong> {product.preparationTime}
            </li>
          )}
          {product.rating !== undefined && (
            <li>
              <strong>Ortalama Puan:</strong> {product.rating}
            </li>
          )}
          {product.reviewCount !== undefined && (
            <li>
              <strong>Yorum Sayısı:</strong> {product.reviewCount}
            </li>
          )}
        </ul>
      </div>

      <div className="comments-section">
        <h2>Yorumlar</h2>
        {isLoggedIn && userType !== "SELLER" && (
          <form onSubmit={handleAddComment} className="comment-form">
            <div className="rating-input">
              <label>Puanınız:</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star-icon ${star <= rating ? "active" : ""}`}
                    onClick={() => setRating(star)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              required
            />
            <button type="submit">Yorum Yap</button>
          </form>
        )}

        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">Henüz yorum yapılmamış</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {(isSellerOfProduct ||
                    (userEmail && comment.user.email === userEmail)) && (
                    <button
                      className="delete-comment"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <FaTrash /> Sil
                    </button>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-rating">
                    {[...Array(comment.rating)].map((_, i) => (
                      <FaStar key={i} className="star-icon" />
                    ))}
                  </div>
                  <p>{comment.content}</p>
                  {comment.sellerReply && !editingReply && (
                    <div className="seller-reply">
                      <strong>Satıcı Yanıtı:</strong>
                      <p>{comment.sellerReply}</p>
                      {isSellerOfProduct && (
                        <button
                          className="edit-reply"
                          onClick={() => {
                            setEditingReply(comment.id);
                            setReplyText({
                              ...replyText,
                              [comment.id]: comment.sellerReply,
                            });
                          }}
                        >
                          Düzenle
                        </button>
                      )}
                    </div>
                  )}
                  {isSellerOfProduct && (
                    <div className="reply-section">
                      {editingReply === comment.id ? (
                        <>
                          <textarea
                            value={replyText[comment.id] || ""}
                            onChange={(e) =>
                              setReplyText({
                                ...replyText,
                                [comment.id]: e.target.value,
                              })
                            }
                            placeholder="Yanıtınızı yazın..."
                          />
                          <div className="reply-buttons">
                            <button onClick={() => handleEditReply(comment.id)}>
                              Güncelle
                            </button>
                            <button
                              onClick={() => {
                                setEditingReply(null);
                                setReplyText({
                                  ...replyText,
                                  [comment.id]: "",
                                });
                              }}
                            >
                              İptal
                            </button>
                          </div>
                        </>
                      ) : !comment.sellerReply ? (
                        <>
                          <textarea
                            value={replyText[comment.id] || ""}
                            onChange={(e) =>
                              setReplyText({
                                ...replyText,
                                [comment.id]: e.target.value,
                              })
                            }
                            placeholder="Yanıtınızı yazın..."
                          />
                          <button onClick={() => handleAddReply(comment.id)}>
                            Yanıtla
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
