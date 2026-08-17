import { supabase } from './supabase';
import { generateWorkoutPlan } from './workoutGenerator';
import type {
  WorkoutDay,
  WorkoutExercise,
  WorkoutPlanWithDays,
} from '../types/workout';

interface UserProfile {
  id: string;
  goal: string | null;
  fitness_level: string | null;
  training_days_per_week: number | null;
  workout_duration: string | null;
  training_location: string | null;
  equipment: string | null;
  sport: string | null;
  health_conditions: string | null;
}

interface WorkoutResult {
  plan: WorkoutPlanWithDays | null;
  error: string | null;
}

export async function getActivePlan(userId: string): Promise<WorkoutResult> {
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    console.error('[WORKOUT] Error fetching plan:', planError.message, planError.code);
    if (planError.code === '42P01' || planError.message?.includes('does not exist')) {
      return { plan: null, error: 'DATABASE_MISSING: The workout tables have not been created yet. Please run the migration SQL in your Supabase dashboard.' };
    }
    return { plan: null, error: null };
  }

  if (!plan) return { plan: null, error: null };

  const { data: days, error: daysError } = await supabase
    .from('workout_days')
    .select('*')
    .eq('workout_plan_id', plan.id)
    .order('order_index');

  if (daysError) {
    console.error('[WORKOUT] Error fetching days:', daysError.message, daysError.code);
    return { plan: { ...plan, days: [] }, error: null };
  }

  if (!days || days.length === 0) {
    return { plan: { ...plan, days: [] }, error: null };
  }

  const dayIds = days.map((d) => d.id);

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('*')
    .in('workout_day_id', dayIds)
    .order('order_index');

  if (exercisesError) {
    console.error('[WORKOUT] Error fetching exercises:', exercisesError.message, exercisesError.code);
    return {
      plan: { ...plan, days: days.map((d) => ({ ...d, exercises: [] })) },
      error: null,
    };
  }

  const exercisesByDay = new Map<string, WorkoutExercise[]>();
  for (const ex of exercises || []) {
    const list = exercisesByDay.get(ex.workout_day_id) || [];
    list.push(ex);
    exercisesByDay.set(ex.workout_day_id, list);
  }

  const daysWithExercises: WorkoutDay[] = days.map((d) => ({
    ...d,
    exercises: exercisesByDay.get(d.id) || [],
  }));

  return { plan: { ...plan, days: daysWithExercises }, error: null };
}

export async function createPlan(profile: UserProfile): Promise<WorkoutResult> {
  // Deactivate any existing active plans (ignore errors if table missing)
  await supabase
    .from('workout_plans')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('user_id', profile.id)
    .eq('active', true);

  // Generate plan from profile
  const generatedDays = generateWorkoutPlan(profile);

  // Insert plan
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: profile.id,
      goal: profile.goal,
      fitness_level: profile.fitness_level,
      training_days_per_week: profile.training_days_per_week,
      workout_duration: profile.workout_duration,
      training_location: profile.training_location,
      equipment: profile.equipment,
      active: true,
    })
    .select()
    .single();

  if (planError || !plan) {
    console.error('[WORKOUT] Error creating plan:', planError?.message, planError?.code);
    if (planError?.code === '42P01' || planError?.message?.includes('does not exist')) {
      return { plan: null, error: 'DATABASE_MISSING: The workout tables have not been created yet. Please run the migration SQL in your Supabase dashboard.' };
    }
    return { plan: null, error: planError?.message || 'Failed to create workout plan.' };
  }

  // Insert days
  const dayInserts = generatedDays.map((d) => ({
    workout_plan_id: plan.id,
    day_of_week: d.day_of_week,
    workout_name: d.workout_name,
    workout_type: d.workout_type,
    is_recovery_day: d.is_recovery_day,
    order_index: d.order_index,
  }));

  const { data: savedDays, error: daysError } = await supabase
    .from('workout_days')
    .insert(dayInserts)
    .select();

  if (daysError || !savedDays) {
    console.error('[WORKOUT] Error creating days:', daysError?.message, daysError?.code);
    return { plan: { ...plan, days: [] }, error: daysError?.message || 'Failed to create workout days.' };
  }

  // Insert exercises for each day
  const allExerciseInserts: Array<WorkoutExercise & { workout_day_id: string }> = [];

  for (let i = 0; i < savedDays.length; i++) {
    const day = savedDays[i];
    const genDay = generatedDays[i];

    if (genDay.exercises.length > 0) {
      const exerciseInserts = genDay.exercises.map((ex) => ({
        workout_day_id: day.id,
        exercise_name: ex.exercise_name,
        target: ex.target,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        instructions: ex.instructions,
        order_index: ex.order_index,
      }));

      const { data: savedExercises, error: exError } = await supabase
        .from('workout_exercises')
        .insert(exerciseInserts)
        .select();

      if (!exError && savedExercises) {
        allExerciseInserts.push(...savedExercises);
      } else {
        console.error('[WORKOUT] Error creating exercises:', exError?.message, exError?.code);
      }
    }
  }

  // Build the full plan
  const exercisesByDay = new Map<string, WorkoutExercise[]>();
  for (const ex of allExerciseInserts) {
    const list = exercisesByDay.get(ex.workout_day_id) || [];
    list.push(ex);
    exercisesByDay.set(ex.workout_day_id, list);
  }

  const daysWithExercises: WorkoutDay[] = savedDays.map((d) => ({
    ...d,
    exercises: exercisesByDay.get(d.id) || [],
  }));

  return { plan: { ...plan, days: daysWithExercises }, error: null };
}

export async function deactivatePlan(planId: string): Promise<void> {
  await supabase
    .from('workout_plans')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', planId);
}
