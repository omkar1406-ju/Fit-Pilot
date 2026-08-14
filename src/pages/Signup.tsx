import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './Signup.css';

export default function Signup() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <span className="auth-card__logo-mark">FP</span>
            FitPilot
          </Link>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Start your personalized fitness journey.</p>
        </div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-group__label">Email</label>
            <input
              className="form-group__input"
              type="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-group__label">Password</label>
            <input
              className="form-group__input"
              type="password"
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label className="form-group__label">Confirm Password</label>
            <input
              className="form-group__input"
              type="password"
              placeholder="Confirm your password"
            />
          </div>
          <Button type="submit" fullWidth size="lg">
            Create Account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
