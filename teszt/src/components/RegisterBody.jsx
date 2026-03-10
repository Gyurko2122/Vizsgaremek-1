export default function RegisterBody({ onLoginClick }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
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
    }
  };

  return (
<main className="body-form">  
        <div className="form-container">
            <h2>Regisztráció</h2>
            <form id="register-form" onSubmit={handleSubmit}>
            <div className="form-group"><input type="text" id="username" placeholder="Felhasználónév" required /></div>
            <div className="form-group"><input type="email" id="email" placeholder="Email cím" required /></div>
            <div className="form-group"><input type="password" id="password" placeholder="Jelszó" required /></div>
            <button type="submit" className="btn-submit">Regisztráció</button>
            <div className="form-links"><a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>Van már fiókod? Jelentkezz be!</a></div>
            </form>
        </div>
</main>
  )
};
