import { useState } from "react";

export default function Navbar({
  onLoginClick,
  isLoggedIn,
  username,
  onLogout,
  onProfileClick,
  onMessagesClick,
  onFavoritesClick,
  onSearchSubmit,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() && onSearchSubmit) {
      onSearchSubmit(searchInput.trim());
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleMessagesClick = () => {
    setDropdownOpen(false);
    if (onMessagesClick) {
      onMessagesClick();
    }
  };

  const handleFavoritesClick = () => {
    setDropdownOpen(false);
    if (onFavoritesClick) {
      onFavoritesClick();
    }
  };

  return (
    <header>
      <div className="container">
        <div className="left-nav">
          <a href="/" className="logo home">
            Piactér
          </a>
          <a href="#news" className="logo news-link">
            Hírek
          </a>
        </div>

        <div className="search-container">
          <form onSubmit={handleSearchSubmit} id="search-form">
            <input
              id="search-input"
              type="search"
              placeholder="Keress termékekre..."
              aria-label="Keress termékekre"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            ></input>
            <button className="search-btn" type="submit"></button>
          </form>
        </div>
        <div className="header-controls">
          {isLoggedIn ? (
            <div className="user-menu-container">
              <button
                className="user-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                Üdvözlünk, {username}! ▼
              </button>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    Profilom
                  </button>
                  <a
                    href="#messages"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMessagesClick();
                    }}
                  >
                    Üzenetek
                  </a>
                  <button
                    className="dropdown-item"
                    onClick={handleFavoritesClick}
                  >
                    ★ Kedvencek
                  </button>
                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    Kijelentkezés
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={onLoginClick}>
              Bejelentkezés
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
