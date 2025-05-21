import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Footer.css";

const Footer = () => {
  const [showFeed, setShowFeed] = useState(false);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  useEffect(() => {
    if (showFeed) {
      setLoadingFeed(true);
      axios
        .get("http://localhost:8080/api/v1/success-stories?page=0&size=5")
        .then((res) => {
          setFeedPosts(res.data.content || res.data);
          setLoadingFeed(false);
        })
        .catch(() => setLoadingFeed(false));
    }
  }, [showFeed]);
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>İletişim</h3>
          <p>Email: info@example.com</p>
          <p>Telefon: +90 123 456 7890</p>
          <p>Adres: Karabük, Türkiye</p>
        </div>

        <div className="footer-section">
          <h3>Hızlı Linkler</h3>
          <ul>
            <li>
              <a href="/">Ana Sayfa</a>
            </li>
            <li>
              <a href="/about">Hakkımızda</a>
            </li>
            <li>
              <a href="/#">Hizmetler</a>
            </li>
            <li>
              <a href="/#">İletişim</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Sosyal Medya</h3>
          <ul className="social-links">
            <li>
              <button
                className="facebook-feed-button"
                onClick={() => setShowFeed(true)}
              >
                <i className="fab fa-facebook"></i> Proje Güncellemeleri
              </button>
            </li>
            <li>
              <a
                href="https://twitter.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-twitter"></i> Twitter
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram"></i> Instagram
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-linkedin"></i> LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 Tüm hakları saklıdır.</p>
      </div>
      {showFeed && (
        <div className="facebook-feed-modal">
          <div className="facebook-feed-content">
            <span className="close-feed" onClick={() => setShowFeed(false)}>
              ×
            </span>
            <h2>Proje Güncellemeleri</h2>
            {loadingFeed ? (
              <div>Yükleniyor...</div>
            ) : feedPosts.length === 0 ? (
              <div>Henüz güncelleme yok.</div>
            ) : (
              feedPosts.map((post) => (
                <div className="fb-post" key={post.id}>
                  <div className="fb-post-header">
                    <img
                      src={
                        post.author?.profilePicture
                          ? `http://localhost:8080/profiles/${post.author.profilePicture}`
                          : "/default-avatar.png"
                      }
                      alt={post.author?.firstName || "Admin"}
                      className="fb-avatar"
                    />
                    <div>
                      <span className="fb-author">
                        {post.author?.firstName} {post.author?.lastName}
                      </span>
                      <span className="fb-date">
                        {new Date(post.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  <div className="fb-post-content">
                    <p>{post.content}</p>
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Güncelleme"
                        className="fb-post-image"
                      />
                    )}
                  </div>
                  <div className="fb-post-actions">
                    <span>👍 {post.likeCount || 0}</span>
                    <span>💬 {post.commentCount || 0}</span>
                    <span>↗️ Paylaş</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
