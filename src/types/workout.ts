export interface WorkoutPlan {
  id: string;
  user_id: string;
  goal: string;
  fitness_level: string | null;
  training_days_per_week: number | null;
  workout_duration: string | null;
  training_location: string | null;
  equipment: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface WorkoutDay {
  id: string;
  workout_plan_id: string;
  day_of_week: string;
  workout_name: string;
  workout_type: string | null;
  is_recovery_day: boolean;
  order_index: number;
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_name: string;
  target: string | null;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  instructions: string | null;
  order_index: number;
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanWithDays extends WorkoutPlan {
  days: WorkoutDayWithExercises[];
}
