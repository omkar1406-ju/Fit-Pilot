import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './Login.css';

export default function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <span className="auth-card__logo-mark">FP</span>
            FitPilot
          </Link>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Log in to continue your fitness journey.</p>
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
              placeholder="Enter your password"
            />
          </div>
          <div className="auth-card__forgot">
            <a href="#">Forgot password?</a>
          </div>
          <Button type="submit" fullWidth size="lg">
            Log In
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
