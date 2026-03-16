export default function Navbar({ onLoginClick, isLoggedIn, username, onLogout }) {
  return (
<header>
        <div className="container">
            <div className="left-nav">
                <a href="/" className="logo home">Piactér</a>
                <a href="#news" className="logo news-link">Hírek</a>
            </div>
            
            
           <div className="search-container">
    <form action="/search-results.html" method="GET" id="search-form">
        <input name="q" id="search-input" type="search" placeholder="Keress termékekre..." aria-label="Keress termékekre"></input>
        <button className="search-btn" type="submit">
            
        </button>
    </form>
</div>
            <div className="header-controls">
                {isLoggedIn ? (
                  <nav className="user-nav" id="user-nav">
                    <span className="username">Üdvözlünk, {username}!</span>
                    <a href="#profile" className="nav-link">Profilom</a>
                    <a href="#messages" className="nav-link">Üzenetek</a>
                    <button className="logout-btn" onClick={onLogout}>Kijelentkezés</button>
                  </nav>
                ) : (
                  <>
                    <nav className="user-nav" id="user-nav"></nav>
                    <button className="login-btn" onClick={onLoginClick}>
                      Bejelentkezés
                    </button>
                  </>
                )}
            </div>
        </div>
    </header>
  );
}
