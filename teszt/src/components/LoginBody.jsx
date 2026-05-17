import { useState } from "react";

export default function LoginBody({ onRegisterClick, onLoginSuccess }) {
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Kérjük, töltsd ki az összes mezőt!");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📤 Sending login request...");
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      console.log("📥 Login response:", response.status, response.ok);
      const data = await response.json();
      console.log("📋 Response data:", {
        message: data.message,
        username: data.username,
        isAdmin: data.isAdmin,
        hasToken: !!data.token,
      });

      if (response.ok) {
        console.log("✅ Login successful, calling onLoginSuccess");
        onLoginSuccess(
          data.username,
          rememberMe,
          data.isAdmin || false,
          data.token,
        );
      } else if (response.status === 403 && data.suspendedUntil) {
        alert(`${data.message}\nOk: ${data.reason}`);
      } else {
        console.error("❌ Login failed:", data.message);
        alert(data.message || "Bejelentkezés sikertelen!");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("Hiba a bejelentkezés során!");
    } finally {
      setIsLoading(false);
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
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "Betöltés..." : "Belépés"}
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
