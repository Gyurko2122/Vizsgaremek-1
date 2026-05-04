import { useState } from 'react';

export default function RegisterBody({ onLoginClick }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // Validáció
    if (!username || !email || !password || !passwordConfirm) {
      alert('Kérjük, töltsd ki az összes mezőt!');
      return;
    }

    if (username.length < 3) {
      alert('A felhasználónév legalább 3 karakter hosszú legyen!');
      return;
    }

    if (password.length < 6) {
      alert('A jelszó legalább 6 karakter hosszú legyen!');
      return;
    }

    if (password !== passwordConfirm) {
      alert('A jelszavak nem egyeznek!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Sikeres regisztráció! Most már bejelentkezhetsz.');
        onLoginClick();
      } else {
        alert(data.message || 'Regisztráció sikertelen!');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('Hiba a regisztráció során!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
<main className="body-form">  
        <div className="form-container">
            <h2>Regisztráció</h2>
            <form id="register-form" onSubmit={handleSubmit}>
            <div className="form-group"><input type="text" id="username" placeholder="Felhasználónév" minLength="3" required /></div>
            <div className="form-group"><input type="email" id="email" placeholder="Email cím" required /></div>
            <div className="form-group"><input type="password" id="password" placeholder="Jelszó" minLength="6" required /></div>
            <div className="form-group"><input type="password" id="passwordConfirm" placeholder="Jelszó megerősítése" minLength="6" required /></div>
            <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? 'Betöltés...' : 'Regisztráció'}</button>
            <div className="form-links"><a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>Van már fiókod? Jelentkezz be!</a></div>
            </form>
        </div>
</main>
  )
};
