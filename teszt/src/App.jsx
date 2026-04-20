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
import SearchResults from "./components/SearchResults";
import AdminPanel from "./components/AdminPanel";
import { getAuthToken, setAuthToken, clearAuthToken } from "./auth";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [messagePartner, setMessagePartner] = useState(null);
  const [messageProductName, setMessageProductName] = useState(null);
  const [profileUsername, setProfileUsername] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  // localStorage/sessionStorage-ből töltjük be a bejelentkezési adatokat
  // JWT token szerver-oldali ellenőrzéssel
  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";

    // Ha nem "remember me", ellenőrizzük a 20 perces lejáratot
    if (!rememberMe) {
      const loginTime = parseInt(sessionStorage.getItem("loginTime"), 10);
      const now = Date.now();
      const twentyMinutes = 20 * 60 * 1000;
      if (!loginTime || now - loginTime > twentyMinutes) {
        // Lejárt a munkamenet — töröljük a helyi adatokat
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("loginTime");
        sessionStorage.removeItem("isAdmin");
        localStorage.removeItem("rememberMe");
        clearAuthToken();
        return;
      }
    }

    // JWT token ellenőrzése a szerverrel
    const token = getAuthToken();
    if (!token) {
      // Nincs token — nem vagyunk bejelentkezve, töröljük a helyi adatokat
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("isAdmin");
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("isAdmin");
      return;
    }

    fetch("/api/verify-token", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        if (data.valid) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setIsAdmin(data.isAdmin || false);
        } else {
          throw new Error("Token invalid");
        }
      })
      .catch(() => {
        // Érvénytelen token — teljes kijelentkeztetés
        clearAuthToken();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("isAdmin");
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("loginTime");
        sessionStorage.removeItem("isAdmin");
      });
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

  const handleLoginSuccess = (
    user,
    rememberMe = false,
    userIsAdmin = false,
    token = null,
  ) => {
    setIsLoggedIn(true);
    setUsername(user);
    setIsAdmin(userIsAdmin);

    // Store JWT token
    if (token) {
      setAuthToken(token, rememberMe);
    }

    if (rememberMe) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", user);
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("isAdmin", userIsAdmin ? "true" : "false");
    } else {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("username", user);
      sessionStorage.setItem("loginTime", Date.now().toString());
      sessionStorage.setItem("isAdmin", userIsAdmin ? "true" : "false");
      localStorage.setItem("rememberMe", "false");
    }

    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setIsAdmin(false);
    setProfileUsername(null);
    setShowProfile(false);
    setShowMessages(false);
    setShowProductDetail(false);
    setSelectedProductId(null);
    setShowFavorites(false);
    setShowSearch(false);
    setShowAdmin(false);
    clearAuthToken();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("isAdmin");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("loginTime");
    sessionStorage.removeItem("isAdmin");
    window.history.pushState(null, "", "/");
  };

  // Handle profile navigation via pathname
  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname;

      if (path === "/profile" && isLoggedIn) {
        setShowProfile(true);
        setProfileUsername(null);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowAdmin(false);
      } else if (path.startsWith("/profile/") && path !== "/profile/") {
        const targetUser = decodeURIComponent(path.split("/profile/")[1]);
        if (targetUser) {
          setProfileUsername(targetUser);
          setShowProfile(true);
          setShowProductDetail(false);
          setShowMessages(false);
          setShowFavorites(false);
          setShowSearch(false);
          setShowAdmin(false);
        }
      } else if (path === "/messages" && isLoggedIn) {
        setShowMessages(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowFavorites(false);
        setShowAdmin(false);
      } else if (path === "/favorites" && isLoggedIn) {
        setShowFavorites(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowAdmin(false);
      } else if (path === "/admin" && isLoggedIn && isAdmin) {
        setShowAdmin(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowFavorites(false);
        setShowSearch(false);
      } else if (path.startsWith("/product/")) {
        const productId = path.split("/product/")[1];
        setSelectedProductId(productId);
        setShowProductDetail(true);
        setShowProfile(false);
        setShowMessages(false);
        setShowSearch(false);
      } else if (path === "/search") {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q") || "";
        setSearchQuery(q);
        setShowSearch(true);
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowFavorites(false);
      } else {
        setShowProfile(false);
        setShowProductDetail(false);
        setShowMessages(false);
        setShowFavorites(false);
        setShowSearch(false);
        setShowAdmin(false);
      }
    };

    // Check on initial load
    handlePathChange();

    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, [isLoggedIn]);

  // Handle /profile navigation
  const navigateToProfile = (targetUsername) => {
    const isOwn = !targetUsername || targetUsername === username;
    if (isOwn && !isLoggedIn) {
      setShowLogin(true);
      return;
    }
    if (isOwn) {
      window.history.pushState(null, "", "/profile");
      setProfileUsername(null);
    } else {
      window.history.pushState(
        null,
        "",
        `/profile/${encodeURIComponent(targetUsername)}`,
      );
      setProfileUsername(targetUsername);
    }
    setShowProfile(true);
    setShowMessages(false);
    setShowProductDetail(false);
    setShowFavorites(false);
    setShowSearch(false);
    setShowAdmin(false);
  };

  const navigateHome = () => {
    window.history.pushState(null, "", "/");
    setShowProfile(false);
    setShowMessages(false);
    setShowFavorites(false);
    setShowSearch(false);
    setShowAdmin(false);
  };

  const navigateToAdmin = () => {
    if (!isAdmin) return;
    window.history.pushState(null, "", "/admin");
    setShowAdmin(true);
    setShowProfile(false);
    setShowMessages(false);
    setShowProductDetail(false);
    setShowFavorites(false);
    setShowSearch(false);
  };

  // Handle product detail navigation
  const navigateToProductDetail = (productId) => {
    window.history.pushState(null, "", `/product/${productId}`);
    setSelectedProductId(productId);
    setShowProductDetail(true);
    setShowFavorites(false);
    setShowProfile(false);
    setShowMessages(false);
    setShowSearch(false);
  };

  const navigateFromProductDetail = () => {
    window.history.pushState(null, "", "/");
    setShowProductDetail(false);
    setSelectedProductId(null);
  };

  // Handle messages navigation
  const navigateToMessages = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    setMessagePartner(null);
    setMessageProductName(null);
    window.history.pushState(null, "", "/messages");
    setShowMessages(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowFavorites(false);
    setShowSearch(false);
    setShowAdmin(false);
  };

  const navigateToMessagesWithPartner = (partner, productName) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    setMessagePartner(partner);
    setMessageProductName(productName || null);
    window.history.pushState(null, "", "/messages");
    setShowMessages(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowFavorites(false);
    setShowSearch(false);
    setShowAdmin(false);
  };

  const navigateToFavorites = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    window.history.pushState(null, "", "/favorites");
    setShowFavorites(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowMessages(false);
    setShowSearch(false);
    setShowAdmin(false);
  };

  const navigateToSearch = (query) => {
    setSearchQuery(query);
    setShowSearch(true);
    setShowProfile(false);
    setShowProductDetail(false);
    setShowMessages(false);
    setShowFavorites(false);
    setShowAdmin(false);
    window.history.pushState(
      null,
      "",
      `/search?q=${encodeURIComponent(query)}`,
    );
  };

  if (showAdmin && isLoggedIn && isAdmin) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
        />
        <div style={{ flex: 1 }}>
          <AdminPanel
            username={username}
            onClose={() => {
              window.history.pushState(null, "", "/");
              setShowAdmin(false);
            }}
          />
        </div>

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

        <Footer />
      </div>
    );
  }

  if (showMessages && isLoggedIn) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
        />
        <Messages
          username={username}
          onClose={() => {
            window.history.pushState(null, "", "/");
            setShowMessages(false);
            setMessagePartner(null);
            setMessageProductName(null);
          }}
          onProfileClick={(targetUsername) => navigateToProfile(targetUsername)}
          onProductClick={(productId) => navigateToProductDetail(productId)}
          initialPartner={messagePartner}
          initialProductName={messageProductName}
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

        <Footer />
      </div>
    );
  }

  if (showProfile && (isLoggedIn || profileUsername)) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
        />
        <Profile
          key={profileUsername || username}
          username={profileUsername || username}
          isOwnProfile={
            isLoggedIn && (!profileUsername || profileUsername === username)
          }
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
          onMessageClick={(targetUser) => {
            navigateToMessages();
          }}
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
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
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
            onLoginClick={() => setShowLogin(true)}
            onMessageSent={(partner, productId, productName) =>
              navigateToMessagesWithPartner(partner, productName)
            }
          />
        </div>

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

        <Footer />
      </div>
    );
  }

  if (showSearch) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar
          onLoginClick={() => setShowLogin(true)}
          isLoggedIn={isLoggedIn}
          username={username}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
        />
        <div style={{ flex: 1 }}>
          <SearchResults
            query={searchQuery}
            onProfileClick={(targetUsername) =>
              navigateToProfile(targetUsername)
            }
            onProductClick={(productId) => navigateToProductDetail(productId)}
            onClose={() => {
              window.history.pushState(null, "", "/");
              setShowSearch(false);
            }}
          />
        </div>

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
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onProfileClick={navigateToProfile}
          onMessagesClick={navigateToMessages}
          onFavoritesClick={navigateToFavorites}
          onSearchSubmit={navigateToSearch}
          onAdminClick={navigateToAdmin}
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
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onProfileClick={navigateToProfile}
        onMessagesClick={navigateToMessages}
        onFavoritesClick={navigateToFavorites}
        onSearchSubmit={navigateToSearch}
        onAdminClick={navigateToAdmin}
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
