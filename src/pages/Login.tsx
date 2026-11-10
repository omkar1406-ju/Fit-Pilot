import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Login.css';

function friendlyError(msg: string): string {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials'))
    return 'Incorrect email or password. Please try again.';
  if (lower.includes('email not confirmed'))
    return 'Please verify your email address before logging in. Check your inbox.';
  if (lower.includes('too many requests') || lower.includes('rate limit'))
    return 'Too many login attempts. Please wait a moment and try again.';
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Network error. Please check your connection and try again.';
  if (lower.includes('user not found'))
    return 'No account found with this email address.';
  return msg;
}

export default function Login() {
  const { signIn, signInWithGoogle, profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect only once BOTH user AND profile are fully resolved.
  // authLoading is true while session + profile are being fetched — wait for it.
  // If user is set but profile is null (and authLoading is false) the profiles
  // row doesn't exist yet — send to onboarding.
  useEffect(() => {
    if (authLoading) return;   // still resolving session / profile — wait
    if (!user) return;          // not logged in — stay on login page
    if (profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(friendlyError(signInError));
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return null;

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

        <button className="google-btn" onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-card__divider">
          <div className="auth-card__divider-line" />
          <span className="auth-card__divider-text">or</span>
          <div className="auth-card__divider-line" />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-group__label">Email</label>
            <input
              className="form-group__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-group__label">Password</label>
            <input
              className="form-group__input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <div className="auth-card__forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
