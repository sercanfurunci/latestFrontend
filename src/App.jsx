import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./Component/Header";
import Footer from "./Component/Footer";
import Home from "./pages/Home";
import Login from "./Component/Login";
import Register from "./Component/Register/Register";
import About from "./pages/About";
import Challenge from "./pages/Challenge";
import ProductList from "./Component/ProductList";
import Profile from "./Component/Profile";
import Admin from "./Component/Admin";
import Messages from "./Component/Messages/Messages";
import SellerDashboard from "./SellerDashboard";
import SellerProfile from "./Component/Seller/SellerProfile";
import ProductDetail from "./Component/ProductDetail/ProductDetail";
import OfferDetail from "./pages/OfferDetail/OfferDetail";
import { useEffect, useState } from "react";
import axios from "axios";
import MessageInbox from "./Component/MessageInbox/MessageInbox";
import Cart from "./Component/Cart/Cart";
import Orders from "./Component/Orders/Orders";
import OrderDetail from "./Component/OrderDetail/OrderDetail";
import SellerOrders from "./Component/SellerOrders/SellerOrders";
import ChatBot from "./ChatBot/ChatBot";
import EducationalContents from "./Component/EducationalContens/EducationalContens";
import SuccessStories from "./SuccessStories/SuccessStories";
import Test from "./Component/Test/Test";
import BuyerProfile from "./Component/BuyerProfile/BuyerProfile";

function App() {
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile(token);
    }
    fetchCategories();
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setUser(response.data);
    } catch (error) {
      console.error(
        "Kullanıcı profili yüklenirken hata:",
        error.response?.data || error.message
      );
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/v1/categories",
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          : {}
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  };

  const updateUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const fetchUnreadMessages = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/messages/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadMessages(res.data);
    } catch (err) {
      setUnreadMessages(0);
    }
  };

  return (
    <div className="App">
      <Header
        user={user}
        categories={categories}
        setUser={setUser}
        unreadMessages={unreadMessages}
        fetchUnreadMessages={fetchUnreadMessages}
      />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<Test />} />
          <Route path="/login" element={<Login updateUser={updateUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route
            path="/profile/:id"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route path="/buyer/:id" element={<BuyerProfile />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              user?.userType === "ADMIN" ? <Admin /> : <Navigate to="/" />
            }
          />
          <Route
            path="/admin/products/pending"
            element={
              user?.userType === "ADMIN" ? <Admin /> : <Navigate to="/" />
            }
          />
          <Route
            path="/admin/pending-products"
            element={
              user?.userType === "ADMIN" ? <Admin /> : <Navigate to="/" />
            }
          />

          {/* Satıcı dashboard'u için yeni route */}
          <Route
            path="/seller-dashboard"
            element={
              user?.userType === "SELLER" ? (
                <SellerDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/messages"
            element={
              <MessageInbox user={user} onUnreadChange={fetchUnreadMessages} />
            }
          />
          <Route path="/messages/:userId" element={<Messages user={user} />} />
          <Route path="/offers/:offerId" element={<OfferDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/seller-orders" element={<SellerOrders />} />
          <Route
            path="/educational-contents"
            element={<EducationalContents />}
          />
          <Route path="/success-stories" element={<SuccessStories />} />
        </Routes>
      </div>
      <ChatBot />
      <Footer />
    </div>
  );
}

export default App;
