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

  // localStorage/sessionStorage-ből töltjük be a bejelentkezési adatokat
  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    let savedUsername, savedIsLoggedIn;

    if (rememberMe) {
      savedUsername = localStorage.getItem("username");
      savedIsLoggedIn = localStorage.getItem("isLoggedIn");
    } else {
      savedUsername = sessionStorage.getItem("username");
      savedIsLoggedIn = sessionStorage.getItem("isLoggedIn");
    }

    if (savedIsLoggedIn === "true" && savedUsername) {
      // Ha nem "remember me", ellenőrizzük a 20 perces lejáratot
      if (!rememberMe) {
        const loginTime = parseInt(sessionStorage.getItem("loginTime"), 10);
        const now = Date.now();
        const twentyMinutes = 20 * 60 * 1000;
        if (!loginTime || now - loginTime > twentyMinutes) {
          // Lejárt a munkamenet
          sessionStorage.removeItem("isLoggedIn");
          sessionStorage.removeItem("username");
          sessionStorage.removeItem("loginTime");
          localStorage.removeItem("rememberMe");
          return;
        }
      }
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  // 20 perces automatikus kijelentkeztetés ha nem "Bejelentkezve maradok"
  useEffect(() => {
    if (!isLoggedIn) return;
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    if (rememberMe) return;

    const loginTime = parseInt(sessionStorage.getItem("loginTime"), 10);
    if (!loginTime) return;

    const twentyMinutes = 20 * 60 * 1000;
    const elapsed = Date.now() - loginTime;
    const remaining = twentyMinutes - elapsed;

    if (remaining <= 0) {
      handleLogout();
      return;
    }

    const timer = setTimeout(() => {
      handleLogout();
      alert("A munkameneted lejárt, kérjük jelentkezz be újra!");
    }, remaining);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

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

  const handleLoginSuccess = (user, rememberMe = false) => {
    setIsLoggedIn(true);
    setUsername(user);

    if (rememberMe) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", user);
      localStorage.setItem("rememberMe", "true");
    } else {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("username", user);
      sessionStorage.setItem("loginTime", Date.now().toString());
      localStorage.setItem("rememberMe", "false");
    }

    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setProfileUsername(null);
    setShowProfile(false);
    setShowMessages(false);
    setShowProductDetail(false);
    setSelectedProductId(null);
    setShowFavorites(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("loginTime");
    window.history.pushState(null, "", "/");
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
    setShowFavorites(false);
    setShowProfile(false);
    setShowMessages(false);
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
          onProfileClick={(targetUsername) => navigateToProfile(targetUsername)}
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
          key={profileUsername || username}
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
          onProductClick={navigateToProductDetail}
        />
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
