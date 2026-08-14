import { useAuth } from '../context/AuthContext';
import './DashboardHeader.css';

export default function DashboardHeader() {
  const { user } = useAuth();
  const email = user?.email || 'User';
  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__greeting">
          Welcome, <span>{email.split('@')[0]}</span>
        </h1>
      </div>
      <div className="dashboard-header__right">
        <button className="dashboard-header__icon-btn" title="Notifications">
          🔔
        </button>
        <div className="dashboard-header__avatar">{initial}</div>
      </div>
    </header>
  );
}
