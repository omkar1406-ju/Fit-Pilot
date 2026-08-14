import { Link, useLocation } from 'react-router-dom';
import './DashboardSidebar.css';

const navItems = [
  { icon: '📊', label: 'Overview', path: '/dashboard' },
  { icon: '💪', label: 'Workouts', path: '/dashboard/workouts' },
  { icon: '📈', label: 'Progress', path: '/dashboard/progress' },
  { icon: '🍽️', label: 'Nutrition', path: '/dashboard/nutrition' },
  { icon: '🎯', label: 'Goals', path: '/dashboard/goals' },
  { icon: '🤖', label: 'Assistant', path: '/dashboard/assistant' },
];

export default function DashboardSidebar() {
  const location = useLocation();

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
        <Link to="/" className="dashboard-sidebar__logout">
          <span className="dashboard-sidebar__link-icon">🚪</span>
          Log Out
        </Link>
      </div>
    </aside>
  );
}
