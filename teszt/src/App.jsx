
import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Body from './components/Body'
import LoginBody from './components/LoginBody'
import RegisterBody from './components/RegisterBody'

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (showLogin || showRegister) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    } 
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showLogin, showRegister]);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        onLoginClick={() => setShowLogin(true)}
        isLoggedIn={isLoggedIn}
        username={username}
        onLogout={handleLogout}
      />
       
      <div>
        {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
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
            <button className="modal-close" onClick={() => setShowRegister(false)}>×</button>
            <RegisterBody onLoginClick={() => {
              setShowRegister(false);
              setShowLogin(true);
            }} />
          </div>
      </div>
      )}
      </div>

      <div style={{ flex: 1 }}>
        <Body />
      </div>

      <Footer />
    </div>
    
  )
}

export default App
