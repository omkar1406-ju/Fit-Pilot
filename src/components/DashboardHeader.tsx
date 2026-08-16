import { useAuth } from '../context/AuthContext';
import './DashboardHeader.css';

export default function DashboardHeader() {
  const { user, profile } = useAuth();
  const name = profile?.name?.trim();
  const displayName = name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__greeting">
          Welcome, <span>{displayName}</span>
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
