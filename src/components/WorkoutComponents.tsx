import type { WorkoutDayWithExercises, WorkoutExercise } from '../types/workout';
import './WorkoutComponents.css';

function ExerciseItem({ exercise }: { exercise: WorkoutExercise }) {
  const formatRest = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="exercise-item">
      <div className="exercise-item__main">
        <div className="exercise-item__name">{exercise.exercise_name}</div>
        <div className="exercise-item__details">
          <span className="exercise-item__tag">{exercise.target}</span>
          <span className="exercise-item__stat">{exercise.sets} sets x {exercise.reps}</span>
        </div>
        {exercise.instructions && (
          <div className="exercise-item__instruction">{exercise.instructions}</div>
        )}
      </div>
      <div className="exercise-item__rest">
        Rest: {formatRest(exercise.rest_seconds || 60)}
      </div>
    </div>
  );
}

function RecoveryDay({ day: _day }: { day: WorkoutDayWithExercises }) {
  return (
    <div className="recovery-day">
      <div className="recovery-day__icon">🌙</div>
      <div className="recovery-day__content">
        <div className="recovery-day__title">Recovery Day</div>
        <div className="recovery-day__desc">
          Rest and let your muscles recover. Light stretching, walking, or foam rolling is fine.
        </div>
      </div>
    </div>
  );
}

export function TodayWorkout({ day }: { day: WorkoutDayWithExercises | null }) {
  if (!day) {
    return (
      <div className="today-workout today-workout--empty">
        <div className="today-workout__empty-icon">📋</div>
        <p className="today-workout__empty-title">No workout scheduled for today</p>
        <p className="today-workout__empty-desc">Check your weekly plan for upcoming sessions.</p>
      </div>
    );
  }

  if (day.is_recovery_day) {
    return (
      <div className="today-workout">
        <div className="today-workout__header">
          <div>
            <span className="today-workout__day">{day.day_of_week}</span>
            <h3 className="today-workout__name">Recovery</h3>
          </div>
        </div>
        <RecoveryDay day={day} />
      </div>
    );
  }

  const estimatedMinutes = day.exercises.reduce((acc, ex) => {
    const sets = ex.sets || 3;
    const restPerSet = (ex.rest_seconds || 60) / 60;
    return acc + sets * 2.5 + (sets - 1) * restPerSet;
  }, 0);

  return (
    <div className="today-workout">
      <div className="today-workout__header">
        <div>
          <span className="today-workout__day">{day.day_of_week}</span>
          <h3 className="today-workout__name">{day.workout_name}</h3>
        </div>
        <span className="today-workout__duration">~{Math.round(estimatedMinutes)} min</span>
      </div>
      <div className="today-workout__exercises">
        {day.exercises.map((ex) => (
          <ExerciseItem key={ex.id || ex.exercise_name} exercise={ex} />
        ))}
      </div>
    </div>
  );
}

export function WeeklyPlan({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: WorkoutDayWithExercises[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const dayAbbr: Record<string, string> = {
    Monday: 'MON',
    Tuesday: 'TUE',
    Wednesday: 'WED',
    Thursday: 'THU',
    Friday: 'FRI',
    Saturday: 'SAT',
    Sunday: 'SUN',
  };

  return (
    <div className="weekly-plan">
      {days.map((day) => (
        <button
          key={day.day_of_week}
          className={`weekly-plan__day ${selectedDay === day.day_of_week ? 'weekly-plan__day--selected' : ''} ${day.is_recovery_day ? 'weekly-plan__day--recovery' : ''}`}
          onClick={() => onSelectDay(day.day_of_week)}
        >
          <span className="weekly-plan__abbr">{dayAbbr[day.day_of_week] || day.day_of_week.slice(0, 3)}</span>
          <span className="weekly-plan__label">
            {day.is_recovery_day ? 'Rest' : day.workout_name}
          </span>
        </button>
      ))}
    </div>
  );
}

export function DayWorkoutDetail({ day }: { day: WorkoutDayWithExercises | null }) {
  if (!day) return null;

  if (day.is_recovery_day) {
    return (
      <div className="day-detail">
        <div className="day-detail__header">
          <span className="day-detail__day">{day.day_of_week}</span>
          <h3 className="day-detail__name">Recovery Day</h3>
        </div>
        <RecoveryDay day={day} />
      </div>
    );
  }

  return (
    <div className="day-detail">
      <div className="day-detail__header">
        <span className="day-detail__day">{day.day_of_week}</span>
        <h3 className="day-detail__name">{day.workout_name}</h3>
      </div>
      <div className="day-detail__exercises">
        {day.exercises.map((ex) => (
          <ExerciseItem key={ex.id || ex.exercise_name} exercise={ex} />
        ))}
      </div>
    </div>
  );
}
