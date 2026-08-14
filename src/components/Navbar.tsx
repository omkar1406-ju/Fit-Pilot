import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">FP</span>
          FitPilot
        </Link>

        <div className="navbar__links">
          <a href="#how-it-works" className="navbar__link">How It Works</a>
          <a href="#features" className="navbar__link">Features</a>
          <a href="#goals" className="navbar__link">Goals</a>
        </div>

        <div className="navbar__actions">
          {user ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </>
          )}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div className={`navbar__mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <a href="#how-it-works" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>How It Works</a>
        <a href="#features" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#goals" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Goals</a>
        {user ? (
          <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
        ) : (
          <>
            <Link to="/login" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Link to="/signup" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
