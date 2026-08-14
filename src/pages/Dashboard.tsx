import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import ProgressCard from '../components/ProgressCard';
import ChatButton from '../components/ChatButton';
import './Dashboard.css';

const exercises = [
  { name: 'Bench Press', info: '4 x 8' },
  { name: 'Overhead Press', info: '3 x 10' },
  { name: 'Lat Pulldown', info: '4 x 10' },
  { name: 'Dumbbell Rows', info: '3 x 12' },
  { name: 'Face Pulls', info: '3 x 15' },
];

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-layout__main">
        <DashboardHeader />
        <div className="dashboard-layout__content">
          <h2 className="dashboard__greeting">Good morning, Alex 👋</h2>
          <p className="dashboard__date">Thursday, August 14, 2026</p>

          <div className="dashboard__grid">
            <div className="dashboard__card dashboard__card--highlight">
              <div className="dashboard__card-icon">💪</div>
              <div className="dashboard__card-label">Today's Workout</div>
              <div className="dashboard__card-value">Upper Body</div>
              <div className="dashboard__card-subtext">5 exercises · 45 min</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">📊</div>
              <div className="dashboard__card-label">Weekly Progress</div>
              <div className="dashboard__card-value">4 / 5</div>
              <div className="dashboard__card-subtext">workouts completed</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">🎯</div>
              <div className="dashboard__card-label">Goal Progress</div>
              <div className="dashboard__card-value">62%</div>
              <div className="dashboard__card-subtext">Muscle Building</div>
            </div>
            <div className="dashboard__card">
              <div className="dashboard__card-icon">🔥</div>
              <div className="dashboard__card-label">Consistency</div>
              <div className="dashboard__card-value">12 days</div>
              <div className="dashboard__card-subtext">current streak</div>
            </div>
          </div>

          <div className="dashboard__progress-section">
            <h3 className="dashboard__section-title">Progress</h3>
            <div className="dashboard__progress-grid">
              <ProgressCard label="Weekly Workouts" value="4/5" progress={80} subtext="1 more to hit your weekly goal" />
              <ProgressCard label="Monthly Goal" value="62%" progress={62} subtext="On track for this month" />
            </div>
          </div>

          <div className="dashboard__bottom-grid">
            <div className="dashboard__workout-card">
              <div className="dashboard__workout-header">
                <span className="dashboard__workout-type">Today's Workout</span>
                <span className="dashboard__workout-duration">45 min</span>
              </div>
              <div className="dashboard__exercise-list">
                {exercises.map((ex) => (
                  <div className="dashboard__exercise" key={ex.name}>
                    <span className="dashboard__exercise-name">{ex.name}</span>
                    <span className="dashboard__exercise-info">{ex.info}</span>
                  </div>
                ))}
              </div>
              <button className="dashboard__action-btn" style={{ width: '100%', justifyContent: 'center' }}>
                <span className="dashboard__action-icon">▶</span>
                Start Workout
              </button>
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
                <h3 className="dashboard__section-title">Nutrition Overview</h3>
                <div className="dashboard__card" style={{ background: 'var(--color-bg-input)', border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="dashboard__card-label" style={{ margin: 0 }}>Calories</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>1,420 / 2,200</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-card)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: '65%', height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '9999px' }} />
                  </div>
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
