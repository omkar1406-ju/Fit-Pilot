import './DashboardHeader.css';

export default function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__greeting">
          Good morning, <span>Alex</span>
        </h1>
      </div>
      <div className="dashboard-header__right">
        <button className="dashboard-header__icon-btn" title="Notifications">
          🔔
        </button>
        <div className="dashboard-header__avatar">A</div>
      </div>
    </header>
  );
}
