import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Body from "./components/Body";
import ProductDetail from "./components/ProductDetail";
import LoginBody from "./components/LoginBody";
import RegisterBody from "./components/RegisterBody";
import Profile from "./components/Profile";
import Messages from "./components/Messages";
import Favorites from "./components/Favorites";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [profileUsername, setProfileUsername] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // localStorage-ből töltjük be a bejelentkezési adatokat
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedIsLoggedIn = localStorage.getItem("isLoggedIn");

    if (savedIsLoggedIn === "true" && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    if (showLogin || showRegister) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showLogin, showRegister]);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", user);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
  };

  // Handle profile navigation via pathname
  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname;

      if (path === "/profile" && isLoggedIn) {
        setShowProfile(true);
        setShowProductDetail(false);
        setShowMessages(false);
      } else if (path === "/messages" && isLoggedIn) {
        setShowMessages(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowFavorites(false);
      } else if (path === "/favorites" && isLoggedIn) {
        setShowFavorites(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
      } else if (path.startsWith("/product/")) {
        const productId = path.split("/product/")[1];
        setSelectedProductId(productId);
        setShowProductDetail(true);
        setShowProfile(false);
        setShowMessages(false);
      } else {
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowFavorites(false);
      }
    };

    // Check on initial load
    handlePathChange();

    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, [isLoggedIn]);

  // Handle /profile navigation
  const navigateToProfile = (targetUsername) => {
    const user = targetUsername || username;
    window.history.pushState(null, "", "/profile");
    setProfileUsername(user);
    setShowProfile(true);
    setShowMessages(false);
    setShowProductDetail(false);
    setShowFavorites(false);
  };

  const navigateHome = () => {
    window.history.pushState(null, "", "/");
    setShowProfile(false);
    setShowMessages(false);
    setShowFavorites(false);
  };

  // Handle product detail navigation
  const navigateToProductDetail = (productId) => {
    window.history.pushState(null, "", `/product/${productId}`);
    setSelectedProductId(productId);
    setShowProductDetail(true);
  };

  const navigateFromProductDetail = () => {
    window.history.pushState(null, "", "/");
    setShowProductDetail(false);
    setSelectedProductId(null);
  };

  // Handle messages navigation
  const navigateToMessages = () => {
    window.history.pushState(null, "", "/messages");
    setShowMessages(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowFavorites(false);
  };

  const navigateToFavorites = () => {
    window.history.pushState(null, "", "/favorites");
    setShowFavorites(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowMessages(false);
  };

  if (showMessages && isLoggedIn) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
        />
        <Messages
          username={username}
          onClose={() => {
            window.history.pushState(null, "", "/");
            setShowMessages(false);
          }}
        />
        <Footer />
      </div>
    );
  }

  if (showProfile && isLoggedIn) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
        />
        <Profile
          username={profileUsername || username}
          isOwnProfile={!profileUsername || profileUsername === username}
          onBack={() => {
            window.history.pushState(null, "", "/");
            setShowProfile(false);
            setProfileUsername(null);
          }}
          onDeleteAccount={() => {
            handleLogout();
            window.history.pushState(null, "", "/");
            setShowProfile(false);
            setProfileUsername(null);
          }}
        />
        <Footer />
      </div>
    );
  }

  if (showFavorites && isLoggedIn) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
        />
        <div style={{ flex: 1 }}>
          <Favorites
            username={username}
            onProductClick={navigateToProductDetail}
            onClose={() => {
              window.history.pushState(null, "", "/");
              setShowFavorites(false);
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (showProductDetail && selectedProductId) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
        />
        <div style={{ flex: 1 }}>
          <ProductDetail
            productId={selectedProductId}
            onBack={navigateFromProductDetail}
            isLoggedIn={isLoggedIn}
            currentUser={username}
            onSellerClick={(sellerUsername) =>
              navigateToProfile(sellerUsername)
            }
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar
        onLoginClick={() => setShowLogin(true)}
        isLoggedIn={isLoggedIn}
        username={username}
        onLogout={handleLogout}
        onProfileClick={navigateToProfile}
        onMessagesClick={navigateToMessages}
        onFavoritesClick={navigateToFavorites}
      />

      <div>
        {showLogin && (
          <div className="modal-overlay" onClick={() => setShowLogin(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowLogin(false)}
              >
                ×
              </button>
              <LoginBody
                onRegisterClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          </div>
        )}
        {showRegister && (
          <div className="modal-overlay" onClick={() => setShowRegister(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowRegister(false)}
              >
                ×
              </button>
              <RegisterBody
                onLoginClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <Body
          onProductClick={navigateToProductDetail}
          isLoggedIn={isLoggedIn}
          currentUser={username}
        />
      </div>

      <Footer />
    </div>
  );
}

export default App;
