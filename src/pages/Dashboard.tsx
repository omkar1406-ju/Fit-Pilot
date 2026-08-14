import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import ChatButton from '../components/ChatButton';
import './Dashboard.css';

export default function Dashboard() {
  const { profile } = useAuth();

  const goalLabel = profile?.goal || 'Not set';

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-layout__main">
        <DashboardHeader />
        <div className="dashboard-layout__content">
          <h2 className="dashboard__greeting">Welcome to FitPilot 👋</h2>
          <p className="dashboard__date">Your personalized fitness dashboard</p>

          <div className="dashboard__grid">
            <div className="dashboard__card dashboard__card--highlight">
              <div className="dashboard__card-icon">🎯</div>
              <div className="dashboard__card-label">Your Goal</div>
              <div className="dashboard__card-value" style={{ fontSize: '1.25rem' }}>{goalLabel}</div>
              <div className="dashboard__card-subtext">Selected during onboarding</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">📋</div>
              <div className="dashboard__card-label">Today's Workout</div>
              <div className="dashboard__card-value" style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>No workout yet</div>
              <div className="dashboard__card-subtext">Your plan will appear here</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">📈</div>
              <div className="dashboard__card-label">Progress</div>
              <div className="dashboard__card-value" style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>No data yet</div>
              <div className="dashboard__card-subtext">Start tracking to see progress</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">🔥</div>
              <div className="dashboard__card-label">Consistency</div>
              <div className="dashboard__card-value" style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>0 days</div>
              <div className="dashboard__card-subtext">Complete your first workout</div>
            </div>
          </div>

          <div className="dashboard__bottom-grid">
            <div className="dashboard__workout-card">
              <div className="dashboard__workout-header">
                <span className="dashboard__workout-type">Your Workout Plan</span>
              </div>
              <div className="dashboard__empty-state">
                <div className="dashboard__empty-icon">📋</div>
                <p className="dashboard__empty-title">No workout plan yet</p>
                <p className="dashboard__empty-desc">Your personalized workout plan will appear here once it's generated.</p>
              </div>
            </div>

            <div className="dashboard__quick-actions">
              <h3 className="dashboard__section-title">Quick Actions</h3>
              <div className="dashboard__actions-grid">
                <button className="dashboard__action-btn">
                  <span className="dashboard__action-icon">💪</span>
                  Start Workout
                </button>
                <button className="dashboard__action-btn">
                  <span className="dashboard__action-icon">🥗</span>
                  Log Meal
                </button>
                <button className="dashboard__action-btn">
                  <span className="dashboard__action-icon">📈</span>
                  View Progress
                </button>
                <button className="dashboard__action-btn">
                  <span className="dashboard__action-icon">🤖</span>
                  Ask Assistant
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h3 className="dashboard__section-title">Nutrition</h3>
                <div className="dashboard__empty-state" style={{ padding: '16px' }}>
                  <p className="dashboard__empty-desc" style={{ margin: 0 }}>Nutrition tracking will be available soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatButton />
    </div>
  );
}
