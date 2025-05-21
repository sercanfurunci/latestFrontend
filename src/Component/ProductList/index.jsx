import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaUserPlus,
  FaUserCheck,
  FaShoppingCart,
} from "react-icons/fa";
import axios from "axios";
import "./ProductList.css";

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

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [followedSellers, setFollowedSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    try {
      const favoritesRes = await api.get("/buyer/favorites");
      setFavorites(favoritesRes.data.map((f) => String(f.product.id)));
    } catch (error) {
      console.error("Favoriler alınamadı:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const followingRes = await api.get("/buyer/following");
      setFollowedSellers(followingRes.data.map((s) => s.id));
    } catch (error) {
      console.error("Takip edilenler alınamadı:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersRes = await api.get("/buyer/orders");
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Siparişler alınamadı:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      const role = localStorage.getItem("userType");
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);
        setProducts(productsRes.data.content);
        setCategories(categoriesRes.data);

        if (isLoggedIn && userRole === "BUYER") {
          await Promise.all([
            fetchFavorites(),
            fetchFollowing(),
            fetchOrders(),
          ]);
          const offersRes = await api.get("/buyer/offers/my-offers");
          setOffers(offersRes.data);
        }
      } catch (err) {
        setError("Veriler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, userRole]);

  const handleToggleFavorite = async (productId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const response = await api.post(
        `/buyer/favorites/toggle/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        await fetchFavorites();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert(
          "Bu işlemi gerçekleştirmek için alıcı hesabına sahip olmanız gerekmektedir."
        );
      }
    }
  };

  const handleToggleFollow = async (sellerId, event) => {
    event.stopPropagation();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      if (followedSellers.includes(sellerId)) {
        await api.delete(`/buyer/unfollow/${sellerId}`);
        await fetchFollowing();
      } else {
        await api.post(`/buyer/follow/${sellerId}`);
        await fetchFollowing();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert("Takip işlemi gerçekleştirilemedi.");
      }
    }
  };

  const handleAddToCart = async (productId, event) => {
    event.stopPropagation();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/cart/add", {
        productId: productId,
        quantity: 1,
      });
      alert("Ürün sepete eklendi!");
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert("Ürün sepete eklenemedi.");
      }
    }
  };

  const filteredAndSortedProducts = () => {
    let filtered = [...products];

    // Sipariş oluşturulan ürünleri filtrele
    if (isLoggedIn && userRole === "BUYER") {
      const orderedProductIds = orders.map((order) => order.product.id);
      filtered = filtered.filter(
        (product) => !orderedProductIds.includes(product.id)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category.id.toString() === selectedCategory
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.name.toLowerCase().includes(searchLower)
      );
    }

    if (priceRange.min !== "") {
      filtered = filtered.filter(
        (product) => product.price >= parseFloat(priceRange.min)
      );
    }
    if (priceRange.max !== "") {
      filtered = filtered.filter(
        (product) => product.price <= parseFloat(priceRange.max)
      );
    }

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    return filtered;
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("default");
    setPriceRange({ min: "", max: "" });
  };

  if (loading) {
    return (
      <div className="main-product-list-loading">
        <div className="main-product-list-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="main-product-list-error">{error}</div>;
  }

  const filteredProducts = filteredAndSortedProducts();

  return (
    <div className="main-product-list-container">
      {/* Filtreler */}
      <div className="main-product-list-filters">
        <div className="main-product-list-search">
          <input
            type="text"
            placeholder="Ürün Ara..."
            className="main-product-list-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="main-product-list-filter-options">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="main-product-list-category-select"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="main-product-list-sort-select"
          >
            <option value="default">Varsayılan Sıralama</option>
            <option value="price-asc">Fiyat (Düşükten Yükseğe)</option>
            <option value="price-desc">Fiyat (Yüksekten Düşüğe)</option>
            <option value="name-asc">İsim (A-Z)</option>
            <option value="name-desc">İsim (Z-A)</option>
          </select>

          <div className="main-product-list-price-range">
            <input
              type="number"
              name="min"
              placeholder="Min Fiyat"
              value={priceRange.min}
              onChange={handlePriceRangeChange}
              className="main-product-list-price-input"
              min="0"
            />
            <input
              type="number"
              name="max"
              placeholder="Max Fiyat"
              value={priceRange.max}
              onChange={handlePriceRangeChange}
              className="main-product-list-price-input"
              min="0"
            />
          </div>

          <button
            onClick={resetFilters}
            className="main-product-list-reset-filters"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      {/* Ürün Listesi */}
      <h2 className="main-product-list-title">
        {filteredProducts.length > 0
          ? `${filteredProducts.length} Ürün Bulundu`
          : "Ürün Bulunamadı"}
      </h2>

      {filteredProducts.length === 0 ? (
        <div className="main-product-list-no-results">
          Arama kriterlerinize uygun ürün bulunamadı.
        </div>
      ) : (
        <div className="main-product-list-grid">
          {filteredProducts.map((product) => {
            const userAcceptedOffer = offers.find(
              (offer) =>
                offer.product.id === product.id && offer.status === "ACCEPTED"
            );

            return (
              <div key={product.id} className="main-product-list-card">
                <div className="main-product-list-image">
                  <img
                    src={
                      product.images && product.images.length > 0
                        ? `http://localhost:8080/uploads/products/${
                            product.id
                          }/${product.images[0].split("/").pop()}`
                        : "/default-product.png"
                    }
                    alt={product.title}
                    onClick={() => navigate(`/products/${product.id}`)}
                  />
                  {isLoggedIn && userRole === "BUYER" && (
                    <button
                      className={`main-product-list-favorite-button ${
                        favorites.includes(String(product.id))
                          ? "favorited"
                          : ""
                      }`}
                      onClick={(e) => handleToggleFavorite(product.id, e)}
                      aria-label={
                        favorites.includes(String(product.id))
                          ? "Favorilerden çıkar"
                          : "Favorilere ekle"
                      }
                    >
                      {favorites.includes(String(product.id)) ? (
                        <FaHeart />
                      ) : (
                        <FaRegHeart />
                      )}
                    </button>
                  )}
                </div>
                <div className="main-product-list-details">
                  <h4 onClick={() => navigate(`/products/${product.id}`)}>
                    {product.title}
                  </h4>
                  <p className="main-product-list-description">
                    {product.description?.substring(0, 100)}
                    {product.description?.length > 100 ? "..." : ""}
                  </p>
                  <p className="main-product-list-category">
                    {product.category?.name}
                  </p>
                  <div className="main-product-list-seller-info">
                    <img
                      src={
                        product.seller.profilePicture
                          ? `http://localhost:8080/profiles/${product.seller.profilePicture}`
                          : "/default-avatar.png"
                      }
                      alt={product.seller.firstName}
                      className="main-product-list-seller-avatar"
                      onClick={() => navigate(`/seller/${product.seller.id}`)}
                    />
                    <div className="main-product-list-seller-details">
                      <span
                        className="main-product-list-seller-name"
                        onClick={() => navigate(`/seller/${product.seller.id}`)}
                      >
                        {product.seller.firstName} {product.seller.lastName}
                      </span>
                      {isLoggedIn && userRole === "BUYER" && (
                        <button
                          className={`main-product-list-follow-button ${
                            followedSellers.includes(product.seller.id)
                              ? "following"
                              : ""
                          }`}
                          onClick={(e) =>
                            handleToggleFollow(product.seller.id, e)
                          }
                        >
                          {followedSellers.includes(product.seller.id) ? (
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
                    </div>
                  </div>
                  {isLoggedIn &&
                    userRole === "BUYER" &&
                    (userAcceptedOffer ? (
                      <button
                        className="main-product-list-add-to-cart"
                        onClick={(e) => handleAddToCart(product.id, e)}
                      >
                        <FaShoppingCart /> Sepete Ekle
                      </button>
                    ) : (
                      <button
                        className="main-product-list-offer-button"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        Teklif Ver
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductList;
