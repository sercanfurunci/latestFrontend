import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import HeroSection from "../Component/HeroSection";
import About from "./About";
import Challenge from "./Challenge";
import "./Home.css";

const Home = () => {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch featured success stories
        const storiesResponse = await axios.get(
          "http://localhost:8080/api/v1/success-stories?page=0&size=3",
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        // Fetch featured educational content
        const contentResponse = await axios.get(
          "http://localhost:8080/api/v1/educational-contents?page=0&size=3",
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (storiesResponse.data.content) {
          setFeaturedStories(storiesResponse.data.content);
        } else {
          setFeaturedStories(storiesResponse.data);
        }

        if (contentResponse.data.content) {
          setFeaturedContent(contentResponse.data.content);
        } else {
          setFeaturedContent(contentResponse.data);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Veriler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button
          className="retry-button"
          onClick={() => {
            setError(null);
            fetchData();
          }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <>
      <HeroSection />

      {/* Featured Success Stories Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Öne Çıkan Başarı Hikayeleri</h2>
          <Link to="/success-stories" className="view-all-link">
            Tümünü Gör
          </Link>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          <div className="featured-grid">
            {featuredStories.map((story) => (
              <div key={story.id} className="featured-card">
                <img
                  src={story.imageUrl || "https://via.placeholder.com/300x200"}
                  alt={story.title}
                  className="featured-image"
                />
                <div className="featured-content">
                  <h3>{story.title}</h3>
                  <p>{story.content?.substring(0, 150)}...</p>
                  <Link
                    to={`/success-stories/${story.id}`}
                    className="read-more-link"
                  >
                    Devamını Oku
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Educational Content Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Öne Çıkan Eğitim İçerikleri</h2>
          <Link to="/educational-contents" className="view-all-link">
            Tümünü Gör
          </Link>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          <div className="featured-grid">
            {featuredContent.map((content) => (
              <div key={content.id} className="featured-card">
                <img
                  src={
                    content.imageUrl || "https://via.placeholder.com/300x200"
                  }
                  alt={content.title}
                  className="featured-image"
                />
                <div className="featured-content">
                  <h3>{content.title}</h3>
                  <p>{content.description?.substring(0, 150)}...</p>
                  <div className="content-meta">
                    <span className="duration">{content.duration} dakika</span>
                    <span className="difficulty">{content.difficulty}</span>
                  </div>
                  <Link
                    to={`/educational-content/${content.id}`}
                    className="read-more-link"
                  >
                    Eğitime Git
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Challenge />
      <About />
    </>
  );
};

export default Home;
