import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaShoppingCart, FaBell } from "react-icons/fa";
import "./Header.css";

const Header = ({
  user,
  categories,
  setUser,
  unreadMessages,
  fetchUnreadMessages,
  cartItems,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const notificationRef = useRef();
  const messageRef = useRef();
  const userMenuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      fetchMessages();
      fetchUnreadMessages();
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      // Bildirim dropdown
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      // Mesaj dropdown
      if (
        showMessages &&
        messageRef.current &&
        !messageRef.current.contains(event.target)
      ) {
        setShowMessages(false);
      }
      // Kullanıcı menüsü
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showMessages, showUserMenu]);
  // Bildirimler
  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/notifications",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(res.data);
    } catch (err) {
      setNotifications([]);
    }
  };

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/notifications/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadCount(res.data);
    } catch (err) {
      setUnreadCount(0);
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        "http://localhost:8080/api/v1/notifications/mark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {}
  };

  // Mesajlar
  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8080/api/v1/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      setMessages([]);
    }
  };

  // Tüm mesajları okundu yap
  const handleMarkAllMessagesRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        "http://localhost:8080/api/v1/messages/mark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMessages();
      fetchUnreadMessages();
    } catch (err) {
      console.error("Mesajlar okundu olarak işaretlenemedi:", err);
    }
  };

  // Tüm mesajları okunmadı yap
  const handleUnmarkAllMessagesRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        "http://localhost:8080/api/v1/messages/unmark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMessages();
      fetchUnreadMessages();
    } catch (err) {
      console.error("Mesajlar okunmadı olarak işaretlenemedi:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setShowUserMenu(false);
    navigate("/");
  };

  const handleNavigation = (path) => {
    const publicRoutes = ["/", "/products", "/about", "/login", "/register"];
    if (publicRoutes.includes(path)) {
      navigate(path);
      setShowUserMenu(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(path);
    setShowUserMenu(false);
  };

  return (
    <header className="main-header">
      <div className="main-header-logo">
        <Link to="/">
          <img src="src\assets\img\emekSepeti.jpeg" alt="site_logo" />
        </Link>
      </div>
      <nav className="main-header-nav">
        <Link to="/">Ana Sayfa</Link>
        <Link
          to="/products"
          onClick={(e) => {
            e.preventDefault();
            handleNavigation("/products");
          }}
        >
          Ürünler
        </Link>
        <Link to="/about">Hakkımızda</Link>
        <Link
          to="/success-stories"
          onClick={(e) => {
            e.preventDefault();
            handleNavigation("/success-stories");
          }}
        >
          Başarı Hikayeleri
        </Link>
        <Link
          to="/educational-content"
          onClick={(e) => {
            e.preventDefault();
            handleNavigation("/educational-contents");
          }}
        >
          Eğitim İçerikleri
        </Link>
      </nav>

      <div className="main-header-right">
        {user && user.userType === "BUYER" && (
          <div className="main-header-cart-section">
            <button
              className="main-header-cart-icon"
              onClick={() => {
                setShowCart(!showCart);
                navigate("/cart");
              }}
            >
              <FaShoppingCart />
              {cartItems > 0 && (
                <span className="main-header-cart-badge">{cartItems}</span>
              )}
            </button>
          </div>
        )}
        {user && (
          <div className="main-header-notification-section">
            <button
              className="main-header-notification-icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (unreadCount > 0) handleMarkAllRead();
              }}
            >
              <span
                className="main-header-bell-icon"
                role="img"
                aria-label="Bildirim"
              >
                <FaBell id="fabell" />
              </span>
              {unreadCount > 0 && (
                <span className="main-header-notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div
                className="main-header-notification-dropdown"
                ref={notificationRef}
              >
                <h4>Bildirimler</h4>
                {notifications.length === 0 ? (
                  <div className="main-header-notification-empty">
                    Hiç bildiriminiz yok.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`main-header-notification-item${
                        n.read ? "" : " unread"
                      }`}
                      style={{ cursor: n.link ? "pointer" : "default" }}
                      onClick={() => {
                        if (n.link) {
                          setShowNotifications(false);
                          navigate(n.link);
                        }
                      }}
                    >
                      {n.message}
                      <span className="main-header-notification-date">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {user && (
          <div className="main-header-message-section">
            <button
              className="main-header-message-icon"
              onClick={() => {
                setShowMessages(!showMessages);
                if (unreadMessages > 0) handleMarkAllMessagesRead();
              }}
            >
              <FaEnvelope />
              {unreadMessages > 0 && (
                <span className="main-header-message-badge">
                  {unreadMessages}
                </span>
              )}
            </button>
            {showMessages && (
              <div className="main-header-message-dropdown" ref={messageRef}>
                <div className="main-header-message-dropdown-header">
                  <h4>Mesajlar</h4>
                </div>
                {messages.length === 0 ? (
                  <div className="main-header-message-empty">
                    Hiç mesajınız yok.
                  </div>
                ) : (
                  messages.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className={`main-header-message-item${
                        m.isRead ? "" : " unread"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="main-header-message-sender"
                        onClick={() =>
                          navigate(
                            `/profile/${
                              m.sender.id === user.id
                                ? m.receiver.id
                                : m.sender.id
                            }`
                          )
                        }
                        title="Profili Görüntüle"
                      >
                        <b>{m.sender.firstName || "Kullanıcı"}</b>
                      </div>
                      <div
                        className="main-header-message-preview"
                        onClick={() => {
                          console.log("showMessages");
                          setShowMessages(false);
                          const otherUserId =
                            m.sender.id === user.id
                              ? m.receiver.id
                              : m.sender.id;
                          navigate(`/messages/${otherUserId}`);
                        }}
                        title="Mesajlaşmaya Git"
                      >
                        {m.content.substring(0, 30)}...
                      </div>
                      <div className="main-header-message-date">
                        {new Date(m.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <div
                  className="main-header-message-all-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("showMessages");
                    setShowMessages(false);
                    navigate("/messages");
                  }}
                >
                  Tüm Mesajlar
                </div>
              </div>
            )}
          </div>
        )}

        <div className="main-header-auth-section">
          {user ? (
            <div className="main-header-user-menu">
              <button
                className="main-header-user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img
                  src={
                    user.profilePicture
                      ? `http://localhost:8080/profiles/${user.profilePicture}`
                      : "/default-avatar.png"
                  }
                  alt="Profil"
                  className="main-header-user-avatar"
                />
                <span>{user.firstName}</span>
              </button>
              {showUserMenu && (
                <div className="main-header-user-dropdown" ref={userMenuRef}>
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(`/profile/${user.id}`);
                    }}
                  >
                    Profilim
                  </Link>
                  {user.userType === "BUYER" && (
                    <Link
                      to="/orders"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation("/orders");
                      }}
                    >
                      Siparişlerim
                    </Link>
                  )}

                  {user.userType === "SELLER" && (
                    <Link
                      to="/seller-dashboard"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation("/seller-dashboard");
                      }}
                    >
                      Kullanıcı Paneli
                    </Link>
                  )}
                  {user.userType === "SELLER" && (
                    <Link
                      to="/seller-orders"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation("/seller-orders");
                      }}
                    >
                      Satışlarım
                    </Link>
                  )}
                  {user.userType === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation("/admin");
                      }}
                    >
                      Admin Paneli
                    </Link>
                  )}
                  <button onClick={handleLogout}>Çıkış Yap</button>
                </div>
              )}
            </div>
          ) : (
            <div className="main-header-auth-buttons">
              <Link to="/login" className="main-header-login-button">
                Giriş Yap
              </Link>
              <Link to="/register" className="main-header-register-button">
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
