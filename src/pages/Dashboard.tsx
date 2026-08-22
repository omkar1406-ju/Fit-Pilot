import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGreeting } from '../lib/greeting';
import { getActivePlan, createPlan } from '../lib/workoutService';
import type { WorkoutPlanWithDays, WorkoutDayWithExercises } from '../types/workout';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import ChatButton from '../components/ChatButton';
import { TodayWorkout, WeeklyPlan, DayWorkoutDetail } from '../components/WorkoutComponents';
import ChangePlanModal from '../components/ChangePlanModal';
import Button from '../components/Button';
import './Dashboard.css';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(getGreeting);
  const [plan, setPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [showChangePlan, setShowChangePlan] = useState(false);

  // Get today's day name
  const getTodayName = useCallback(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  // Set today on mount
  useEffect(() => {
    setSelectedDay(getTodayName());
  }, [getTodayName]);

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Load plan from Supabase
  const loadPlan = useCallback(async () => {
    if (!user) return;
    setPlanLoading(true);
    const result = await getActivePlan(user.id);
    setPlan(result.plan);
    setPlanLoading(false);
  }, [user]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleCreatePlan = async () => {
    if (!user || !profile) return;
    setCreating(true);
    const result = await createPlan({
      id: user.id,
      goal: profile.goal,
      fitness_level: profile.fitness_level,
      training_days_per_week: profile.training_days_per_week,
      workout_duration: profile.workout_duration,
      training_location: profile.training_location,
      equipment: profile.equipment,
      sport: profile.sport,
      health_conditions: profile.health_conditions,
    });
    setPlan(result.plan);
    setCreating(false);
    if (result.plan) {
      setSelectedDay(getTodayName());
    }
  };

  const handlePlanChange = () => {
    loadPlan();
  };

  const goalLabel = profile?.goal || 'Not set';
  const displayName = profile?.name?.trim() || 'there';

  // Get today's workout
  const todayName = getTodayName();
  const todayWorkout: WorkoutDayWithExercises | null =
    plan?.days.find((d) => d.day_of_week === todayName) || null;

  // Get selected day's workout
  const selectedDayWorkout: WorkoutDayWithExercises | null =
    plan?.days.find((d) => d.day_of_week === selectedDay) || null;

  // Count active training days
  const activeDays = plan?.days.filter((d) => !d.is_recovery_day).length || 0;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-layout__main">
        <DashboardHeader />
        <div className="dashboard-layout__content">
          <h2 className="dashboard__greeting">{greeting}, {displayName}</h2>
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
              <div className="dashboard__card-value" style={{ fontSize: '0.9375rem', color: todayWorkout && !todayWorkout.is_recovery_day ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {planLoading
                  ? 'Loading...'
                  : todayWorkout
                    ? todayWorkout.is_recovery_day
                      ? 'Recovery Day'
                      : todayWorkout.workout_name
                    : 'No plan yet'}
              </div>
              <div className="dashboard__card-subtext">
                {plan && todayWorkout && !todayWorkout.is_recovery_day
                  ? `${todayWorkout.exercises.length} exercises`
                  : todayWorkout?.is_recovery_day
                    ? 'Rest and recover'
                    : 'Create your plan to start'}
              </div>
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
              <div className="dashboard__card-value" style={{ fontSize: '0.9375rem', color: activeDays > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {activeDays > 0 ? `${activeDays} days/week` : '0 days'}
              </div>
              <div className="dashboard__card-subtext">
                {activeDays > 0 ? `${plan?.training_days_per_week || activeDays} training days` : 'Complete your first workout'}
              </div>
            </div>
          </div>

          <div className="dashboard__bottom-grid">
            <div className="dashboard__workout-section">
              {/* No plan - show create state */}
              {!planLoading && !plan && (
                <div className="workout-create">
                  {creating ? (
                    <div className="workout-create__loading">
                      <div className="workout-create__spinner" />
                      <p className="workout-create__loading-text">Creating your personalized plan...</p>
                    </div>
                  ) : (
                    <>
                      <div className="workout-create__icon">💪</div>
                      <h3 className="workout-create__title">Create your personalized workout plan</h3>
                      <p className="workout-create__desc">
                        Based on your goal of <strong>{goalLabel}</strong>, we'll generate a
                        structured weekly training program tailored to your experience and equipment.
                      </p>
                      {profile?.health_conditions && (
                        <div className="health-warning">
                          Note: You have listed health conditions ({profile.health_conditions}).
                          This plan is not medical advice. Please consult a professional if needed.
                        </div>
                      )}
                      <Button onClick={handleCreatePlan} size="lg">
                        Create My Plan
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Has plan - show today + weekly */}
              {plan && (
                <>
                  <div className="dashboard__workout-header">
                    <span className="dashboard__workout-type">Today's Workout</span>
                    <button
                      className="dashboard__change-plan-btn"
                      onClick={() => setShowChangePlan(true)}
                    >
                      Change Plan
                    </button>
                  </div>
                  <TodayWorkout day={todayWorkout} />

                  <div style={{ marginTop: '24px' }}>
                    <div className="dashboard__workout-header">
                      <span className="dashboard__workout-type">Weekly Plan</span>
                    </div>
                    <WeeklyPlan
                      days={plan.days}
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                    />
                    {selectedDayWorkout && selectedDay !== todayName && (
                      <div style={{ marginTop: '16px' }}>
                        <DayWorkoutDetail day={selectedDayWorkout} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="dashboard__quick-actions">
              <h3 className="dashboard__section-title">Quick Actions</h3>
              <div className="dashboard__actions-grid">
                <button className="dashboard__action-btn" onClick={() => navigate('/dashboard/workouts')}>
                  <span className="dashboard__action-icon">💪</span>
                  Start Workout
                </button>
                <button className="dashboard__action-btn" onClick={() => navigate('/dashboard/nutrition')}>
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
                <button
                  className="dashboard__empty-state"
                  style={{ padding: '16px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  onClick={() => navigate('/dashboard/nutrition')}
                >
                  <p className="dashboard__empty-desc" style={{ margin: 0 }}>
                    🍽️ Set up your personalized nutrition plan →
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatButton />
      {profile && (
        <ChangePlanModal
          isOpen={showChangePlan}
          onClose={() => setShowChangePlan(false)}
          onPlanCreated={handlePlanChange}
          currentProfile={profile}
        />
      )}
    </div>
  );
}
