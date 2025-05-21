import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./Messages.css";

const API_URL = "http://localhost:8080/api/v1";

const Messages = ({ user }) => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (userId) {
      fetchConversation();
    }
    // eslint-disable-next-line
  }, [userId, user]);

  const fetchConversation = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userId || !user) return;
    try {
      const res = await axios.get(
        `${API_URL}/messages/conversation/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
      setError(null);
      // Karşıdaki kullanıcıyı bul
      if (res.data.length > 0) {
        const msg = res.data[0];
        setOtherUser(msg.sender.id === user.id ? msg.receiver : msg.sender);
      }
    } catch (err) {
      setMessages([]);
      setError("Mesajlar yüklenirken bir hata oluştu");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/messages`,
        {
          receiverId: userId,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewMessage("");
      fetchConversation();
    } catch (err) {
      alert("Mesaj gönderilemedi.");
    }
  };

  if (!user) {
    return null;
  }

  if (error) {
    return <div className="messages-error">{error}</div>;
  }

  return (
    <div className="messages-container">
      {otherUser && (
        <div className="messages-header">
          <button
            className="back-button"
            onClick={() => navigate("/messages")}
            title="Mesaj kutusuna dön"
          >
            ← Geri
          </button>
          <img
            src={
              otherUser.profilePicture
                ? `http://localhost:8080/profiles/${otherUser.profilePicture}`
                : "/default-avatar.png"
            }
            alt="Profil"
            className="user-avatar"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: 12,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/seller/${otherUser.id}`)}
            title="Profili Görüntüle"
          />
          <div>
            <div
              className="other-user-name"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/seller/${otherUser.id}`)}
              title="Profili Görüntüle"
            >
              <b>
                {otherUser.firstName} {otherUser.lastName}
              </b>
            </div>
          </div>
        </div>
      )}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="messages-empty">Henüz mesaj yok.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.sender.id === user.id ? "sent" : "received"
              }`}
            >
              <div className="message-meta">
                <span className="message-sender">
                  {msg.sender.id === user.id
                    ? "Siz"
                    : `${msg.sender.firstName} ${msg.sender.lastName}`}
                  {!msg.isRead && msg.sender.id !== user.id && (
                    <span className="unread-dot" title="Okunmamış mesaj"></span>
                  )}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
              <div className="message-date">
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
      <form className="messages-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
        />
        <button type="submit">Gönder</button>
      </form>
    </div>
  );
};

export default Messages;
