import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link to="/dashboard">
            <Button variant="primary" size="sm">Dashboard</Button>
          </Link>
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
        <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
      </div>
    </nav>
  );
}
