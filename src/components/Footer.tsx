import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-mark">FP</span>
              FitPilot
            </div>
            <p className="footer__desc">
              Personalized fitness plans built around your goals, your schedule, and your lifestyle.
              Less manual work. More progress.
            </p>
          </div>

          <div>
            <h4 className="footer__col-title">Product</h4>
            <div className="footer__links">
              <a href="#features" className="footer__link">Features</a>
              <a href="#goals" className="footer__link">Goals</a>
              <a href="#how-it-works" className="footer__link">How It Works</a>
              <Link to="/dashboard" className="footer__link">Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 className="footer__col-title">Company</h4>
            <div className="footer__links">
              <span className="footer__link">About</span>
              <span className="footer__link">Careers</span>
              <span className="footer__link">Blog</span>
              <span className="footer__link">Contact</span>
            </div>
          </div>

          <div>
            <h4 className="footer__col-title">Legal</h4>
            <div className="footer__links">
              <span className="footer__link">Privacy Policy</span>
              <span className="footer__link">Terms of Service</span>
              <span className="footer__link">Cookie Policy</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">&copy; {new Date().getFullYear()} FitPilot. All rights reserved.</p>
          <div className="footer__bottom-links">
            <span className="footer__bottom-link">Privacy</span>
            <span className="footer__bottom-link">Terms</span>
            <span className="footer__bottom-link">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
