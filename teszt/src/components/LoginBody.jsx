import { useState } from "react";

export default function LoginBody({ onRegisterClick, onLoginSuccess }) {
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        onLoginSuccess(data.username, rememberMe);
      } else {
        alert(data.message || "Bejelentkezés sikertelen!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Hiba a bejelentkezés során!");
    }
  };

  return (
    <main className="body-form">
      <div className="form-container">
        <h2>Bejelentkezés</h2>
        <form id="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="email" id="email" placeholder="E-mail" required />
          </div>
          <div className="form-group">
            <input
              type="password"
              id="password"
              placeholder="Jelszó"
              required
            />
          </div>
          <div className="remember-me-group">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Bejelentkezve maradok</span>
            </label>
          </div>
          <button type="submit" className="btn-submit">
            Belépés
          </button>
          <div className="form-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onRegisterClick();
              }}
            >
              Nincs még fiókod? Regisztrálj!
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
