import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCheck, FaUserPlus, FaEnvelope } from "react-icons/fa";
import "./SellerProfile.css";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orderedProductIds, setOrderedProductIds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);

    if (token && user) {
      setIsLoggedIn(true);
      setUserRole(user.userType);

      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        if (tokenPayload.role !== `ROLE_${user.userType}`) {
          setIsLoggedIn(false);
          setUserRole(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserRole(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        setError(null);

        const sellerRes = await api.get(`/users/${id}`);
        if (!sellerRes.data) throw new Error("Satıcı bilgileri bulunamadı");
        const sellerData = sellerRes.data;

        const productsRes = await api.get(`/products?sellerId=${id}`);
        const productsData = productsRes.data.content || [];
        const filteredProducts = productsData.filter(
          (product) => product.seller.id === parseInt(id)
        );
        setSeller(sellerData);
        setProducts(filteredProducts);

        if (isLoggedIn && userRole === "BUYER") {
          try {
            const followingRes = await api.get("/buyer/following");
            const isFollowing = followingRes.data.some(
              (f) => f.id === parseInt(id)
            );
            setIsFollowing(isFollowing);
          } catch {
            setIsFollowing(false);
          }
        }
      } catch (err) {
        if (err.response?.status === 404) setError("Satıcı bulunamadı.");
        else if (err.response?.status === 403)
          setError("Bu sayfaya erişim izniniz yok.");
        else
          setError(
            "Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSellerData();
  }, [id, isLoggedIn, userRole]);

  // Satın alınan ürünlerin id'lerini çek
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("userType");
        if (isLoggedIn && userType === "BUYER") {
          const response = await api.get("/buyer/orders");
          const ids = response.data.map((order) => order.product.id);
          setOrderedProductIds(ids);
        }
      } catch (error) {
        setOrderedProductIds([]);
      }
    };
    fetchOrders();
  }, [isLoggedIn]);

  const handleToggleFollow = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token bulunamadı");
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      if (!tokenPayload.authorities?.includes("ROLE_BUYER")) {
        throw new Error("Bu işlem için BUYER yetkisi gerekiyor");
      }
      if (isFollowing) {
        await api.delete(`/buyer/unfollow/${id}`);
        setIsFollowing(false);
      } else {
        await api.post(`/buyer/follow/${id}`);
        setIsFollowing(true);
      }
      const updatedSellerRes = await api.get(`/users/${id}`);
      setSeller(updatedSellerRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (error.response?.status === 403) {
        alert(
          "Bu işlem için yetkiniz yok. Lütfen BUYER hesabıyla giriş yapın."
        );
      } else {
        alert(
          "Takip işlemi gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin."
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="seller-profile-loading">
        <div className="seller-profile-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-profile-error">
        <div className="seller-profile-error-message">{error}</div>
        <button
          className="seller-profile-back-button"
          onClick={() => navigate(-1)}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="seller-profile-error">
        <div className="seller-profile-error-message">Satıcı bulunamadı.</div>
        <button
          className="seller-profile-back-button"
          onClick={() => navigate(-1)}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  // Satın alınan ürünleri filtrele
  const visibleProducts =
    isLoggedIn && userRole === "BUYER"
      ? products.filter((product) => !orderedProductIds.includes(product.id))
      : products;

  return (
    <div className="seller-profile-container">
      <div className="seller-profile-card">
        <div className="seller-profile-avatar-section">
          <img
            src={
              seller.profilePicture
                ? `http://localhost:8080/profiles/${seller.profilePicture}`
                : "/default-avatar.png"
            }
            alt={seller.firstName}
            className="seller-profile-avatar"
          />
        </div>
        <div className="seller-profile-main">
          <h1 className="seller-profile-name">
            {seller.firstName} {seller.lastName}
          </h1>
          <p className="seller-profile-bio">
            {seller.bio || "Henüz biyografi eklenmemiş."}
          </p>
          <div className="seller-profile-stats">
            <div>
              <span className="seller-profile-stat-value">
                {products.length}
              </span>
              <span className="seller-profile-stat-label">Ürün</span>
            </div>
            <div>
              <span className="seller-profile-stat-value">
                {seller.followerCount || 0}
              </span>
              <span className="seller-profile-stat-label">Takipçi</span>
            </div>
            <div>
              <span className="seller-profile-stat-value">
                {seller.sellerRating || "0.0"}
              </span>
              <span className="seller-profile-stat-label">Puan</span>
            </div>
          </div>
          <div className="seller-profile-actions">
            {isLoggedIn &&
              userRole === "BUYER" &&
              seller.userType === "SELLER" && (
                <button
                  className={`seller-profile-follow-btn ${
                    isFollowing ? "following" : ""
                  }`}
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? (
                    <>
                      <FaUserCheck /> Takipte
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Takip Et
                    </>
                  )}
                </button>
              )}
            {isLoggedIn &&
              seller.userType === "SELLER" &&
              currentUser &&
              currentUser.id !== seller.id && (
                <button
                  className="seller-profile-message-btn"
                  onClick={() => navigate(`/messages/${seller.id}`)}
                >
                  <FaEnvelope style={{ marginRight: 6 }} />
                  Mesaj Gönder
                </button>
              )}
          </div>
        </div>
      </div>

      <div className="seller-profile-products">
        <h2>Satıcının Ürünleri</h2>
        {visibleProducts.length === 0 ? (
          <div className="seller-profile-no-products">
            <p>Henüz ürün bulunmuyor.</p>
          </div>
        ) : (
          <div className="seller-profile-products-grid left-align">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="seller-profile-product-card"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="seller-profile-product-image">
                  <img
                    src={
                      product.images && product.images.length > 0
                        ? `http://localhost:8080/uploads/products/${
                            product.id
                          }/${product.images[0].split("/").pop()}`
                        : "/default-product.png"
                    }
                    alt={product.title}
                  />
                </div>
                <div className="seller-profile-product-details">
                  <h3>{product.title}</h3>
                  <p className="seller-profile-product-description">
                    {product.description?.substring(0, 100)}
                    {product.description?.length > 100 ? "..." : ""}
                  </p>
                  <p className="seller-profile-product-category">
                    {product.category?.name}
                  </p>
                  <p className="seller-profile-product-price">
                    {product.price} TL
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerProfile;
