import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaArrowLeft } from "react-icons/fa";
import "./Cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get("http://localhost:8080/api/v1/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sadece ilk ürünü göster
      setCartItems(response.data.length > 0 ? [response.data[0]] : []);
    } catch (err) {
      setError("Sepet bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:8080/api/v1/cart/remove/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchCartItems();
    } catch (err) {
      alert("Ürün sepetten çıkarılamadı.");
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/v1/cart/update/${productId}`,
        { quantity: newQuantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchCartItems();
    } catch (err) {
      alert("Miktar güncellenemedi.");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // SİPARİŞ OLUŞTURMA
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!shippingAddress.trim()) {
      setAddressError("Teslimat adresi zorunludur.");
      return;
    }
    setAddressError("");
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem("token");
      for (const item of cartItems) {
        await axios.post(
          "http://localhost:8080/api/v1/buyer/orders",
          {
            offerId: item.acceptedOfferId,
            productId: item.product.id,
            shippingAddress: shippingAddress,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      alert("Sipariş başarıyla oluşturuldu!");
      // Sepeti temizle
      setCartItems([]);
      setShippingAddress("");
      navigate("/orders");
    } catch (err) {
      alert(
        err.response?.data?.error || "Sipariş oluşturulurken bir hata oluştu!"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="cart-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="cart-error">{error}</div>;
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <button className="cart-back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Geri Dön
        </button>
        <h1>Sepetim</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h2>Sepetiniz Boş</h2>
          <p>Sepetinizde henüz ürün bulunmuyor.</p>
          <button
            onClick={() => navigate("/products")}
            className="cart-shop-button"
          >
            Alışverişe Başla
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={
                      item.product.images && item.product.images.length > 0
                        ? `http://localhost:8080/uploads/products/${
                            item.product.id
                          }/${item.product.images[0].split("/").pop()}`
                        : "/default-product.png"
                    }
                    alt={item.product.title}
                  />
                </div>
                <div className="cart-item-details">
                  <h3>{item.product.title}</h3>
                  <p className="cart-item-price">{item.price} TL</p>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => handleRemoveItem(item.product.id)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Toplam:</span>
              <span>{calculateTotal()} TL</span>
            </div>
            <div className="cart-address-input">
              <label htmlFor="shippingAddress">Teslimat Adresi:</label>
              <input
                id="shippingAddress"
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Adresinizi girin"
                className="cart-address-field"
                disabled={checkoutLoading}
                required
              />
              {addressError && (
                <div className="cart-address-error">{addressError}</div>
              )}
            </div>
            <button
              className="cart-checkout-button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading
                ? "Sipariş Oluşturuluyor..."
                : "Siparişi Tamamla"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
