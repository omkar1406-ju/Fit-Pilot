import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardSidebar.css';

const navItems = [
  { icon: '📊', label: 'Overview', path: '/dashboard' },
  { icon: '💪', label: 'Workouts', path: '/dashboard/workouts' },
  { icon: '📈', label: 'Progress', path: '/dashboard/progress' },
  { icon: '🍽️', label: 'Nutrition', path: '/dashboard/nutrition' },
  { icon: '🎯', label: 'Goals', path: '/dashboard/goals' },
  { icon: '🤖', label: 'Assistant', path: '/dashboard/assistant' },
  { icon: '👤', label: 'Edit Profile', path: '/dashboard/profile' },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__logo">
        <span className="dashboard-sidebar__logo-mark">FP</span>
        FitPilot
      </div>

      <nav className="dashboard-sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`dashboard-sidebar__link ${
              location.pathname === item.path ? 'dashboard-sidebar__link--active' : ''
            }`}
          >
            <span className="dashboard-sidebar__link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="dashboard-sidebar__footer">
        <button onClick={handleLogout} className="dashboard-sidebar__logout">
          <span className="dashboard-sidebar__link-icon">🚪</span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
