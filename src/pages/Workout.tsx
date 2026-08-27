import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivePlan, createPlan } from '../lib/workoutService';
import type { WorkoutPlanWithDays, WorkoutDayWithExercises } from '../types/workout';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { TodayWorkout, WeeklyPlan, DayWorkoutDetail } from '../components/WorkoutComponents';
import ChangePlanModal from '../components/ChangePlanModal';
import './Workout.css';

export default function Workout() {
  const { user, profile, refreshProfile } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [error, setError] = useState('');
  const autoRegeneratedRef = useRef(false);

  const getTodayName = useCallback(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  useEffect(() => {
    setSelectedDay(getTodayName());
  }, [getTodayName]);

  useEffect(() => {
    refreshProfile();
  }, []);

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setPlanLoading(true);
    setError('');
    const result = await getActivePlan(user.id);
    setPlan(result.plan);
    if (result.error) setError(result.error);
    setPlanLoading(false);
  }, [user]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleCreatePlan = useCallback(async () => {
    if (!user || !profile) return;
    setCreating(true);
    setError('');
    try {
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
      if (result.error) {
        setError(result.error);
      } else {
        setPlan(result.plan);
        if (result.plan) {
          setSelectedDay(getTodayName());
        }
      }
    } catch (e) {
      console.error('[WORKOUT] Unexpected error:', e);
      setError('An unexpected error occurred. Please try again.');
    }
    setCreating(false);
  }, [user, profile, getTodayName]);

  useEffect(() => {
    if (!plan || !profile || planLoading || creating || autoRegeneratedRef.current) return;

    const planIsOutdated =
      plan.goal !== profile.goal ||
      plan.fitness_level !== profile.fitness_level ||
      plan.training_days_per_week !== profile.training_days_per_week ||
      plan.workout_duration !== profile.workout_duration ||
      plan.training_location !== profile.training_location ||
      plan.equipment !== profile.equipment;

    if (planIsOutdated) {
      autoRegeneratedRef.current = true;
      handleCreatePlan();
    }
  }, [plan, profile, planLoading, creating, handleCreatePlan]);

  const handlePlanChange = () => {
    loadPlan();
  };

  const goalLabel = profile?.goal || 'General Fitness';
  const isDbMissing = error.startsWith('DATABASE_MISSING: ');
  const displayError = isDbMissing ? error.replace('DATABASE_MISSING: ', '') : error;

  const todayName = getTodayName();
  const todayWorkout: WorkoutDayWithExercises | null =
    plan?.days.find((d) => d.day_of_week === todayName) || null;

  const selectedDayWorkout: WorkoutDayWithExercises | null =
    plan?.days.find((d) => d.day_of_week === selectedDay) || null;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-layout__main">
        <DashboardHeader />
        <div className="dashboard-layout__content">
          <div className="workout-page__top">
            <div className="workout-page__header">
              <h2 className="workout-page__title">My Workout</h2>
              {plan && (
                <button
                  className="workout-page__change-btn"
                  onClick={() => setShowChangePlan(true)}
                >
                  Change Plan
                </button>
              )}
            </div>
            {plan && (
              <p className="workout-page__subtitle">
                Goal: {plan.goal} · {plan.training_days_per_week} days/week · {plan.workout_duration} min sessions
              </p>
            )}
          </div>

          {error && (
            <div className="workout-page__error">
              <p>{displayError}</p>
              {isDbMissing && (
                <div className="workout-page__error-sql">
                  <p>Run this SQL in your Supabase Dashboard → SQL Editor:</p>
                  <pre>{`-- Copy the contents of supabase/migrations/003_workout_tables.sql and run it here`}</pre>
                </div>
              )}
            </div>
          )}

          {creating && plan && (
            <div className="workout-page__regenerating">
              <div className="workout-create__spinner" />
              <p>Regenerating your plan with updated profile...</p>
            </div>
          )}

          {!planLoading && !plan && !isDbMissing && (
            <div className="workout-page__create">
              {creating ? (
                <div className="workout-create__loading">
                  <div className="workout-create__spinner" />
                  <p className="workout-create__loading-text">Creating your personalized plan...</p>
                </div>
              ) : (
                <>
                  <div className="workout-create__icon">💪</div>
                  <h3 className="workout-create__title">
                    No workout plan yet
                  </h3>
                  <p className="workout-create__desc">
                    Create a personalized weekly workout plan based on your goal of <strong>{goalLabel}</strong>.
                    We'll generate a structured program tailored to your experience and equipment.
                  </p>
                  {profile?.health_conditions && (
                    <div className="health-warning">
                      Note: You have listed health conditions ({profile.health_conditions}).
                      This plan is not medical advice. Please consult a professional if needed.
                    </div>
                  )}
                  <button
                    className="workout-page__create-btn"
                    onClick={handleCreatePlan}
                    disabled={creating}
                  >
                    Create My Plan
                  </button>
                </>
              )}
            </div>
          )}

          {plan && (
            <div className="workout-page__content">
              <div className="workout-page__today">
                <h3 className="workout-page__section-title">Today's Workout</h3>
                <TodayWorkout day={todayWorkout} />
              </div>

              <div className="workout-page__weekly">
                <h3 className="workout-page__section-title">Weekly Plan</h3>
                <WeeklyPlan
                  days={plan.days}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
                {selectedDayWorkout && selectedDay !== todayName && (
                  <div className="workout-page__day-detail">
                    <DayWorkoutDetail day={selectedDayWorkout} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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
