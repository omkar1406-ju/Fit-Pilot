-- Workout plan tables
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. workout_plans: one active plan per user
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  fitness_level TEXT,
  training_days_per_week INTEGER,
  workout_duration TEXT,
  training_location TEXT,
  equipment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL
);

-- 2. workout_days: each day in a plan
CREATE TABLE IF NOT EXISTS workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  workout_type TEXT,
  is_recovery_day BOOLEAN DEFAULT false NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 3. workout_exercises: exercises within a day
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  target TEXT,
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  instructions TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(user_id, active);
CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id ON workout_days(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day_id ON workout_exercises(workout_day_id);

-- RLS: Users can only read/write their own workout data
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- workout_plans policies
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- workout_days policies (access via plan ownership)
CREATE POLICY "Users can view their own workout days"
  ON workout_days FOR SELECT TO authenticated
  USING (
    workout_plan_id IN (
      SELECT id FROM workout_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workout days"
  ON workout_days FOR INSERT TO authenticated
  WITH CHECK (
    workout_plan_id IN (
      SELECT id FROM workout_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout days"
  ON workout_days FOR UPDATE TO authenticated
  USING (
    workout_plan_id IN (
      SELECT id FROM workout_plans WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_plan_id IN (
      SELECT id FROM workout_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workout days"
  ON workout_days FOR DELETE TO authenticated
  USING (
    workout_plan_id IN (
      SELECT id FROM workout_plans WHERE user_id = auth.uid()
    )
  );

-- workout_exercises policies (access via day -> plan ownership)
CREATE POLICY "Users can view their own workout exercises"
  ON workout_exercises FOR SELECT TO authenticated
  USING (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN workout_plans wp ON wd.workout_plan_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workout exercises"
  ON workout_exercises FOR INSERT TO authenticated
  WITH CHECK (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN workout_plans wp ON wd.workout_plan_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout exercises"
  ON workout_exercises FOR UPDATE TO authenticated
  USING (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN workout_plans wp ON wd.workout_plan_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN workout_plans wp ON wd.workout_plan_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workout exercises"
  ON workout_exercises FOR DELETE TO authenticated
  USING (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN workout_plans wp ON wd.workout_plan_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  );
