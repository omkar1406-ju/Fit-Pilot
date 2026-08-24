-- Scanned meals tables for the Meal Photo Scanner feature
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. scanned_meals: each scanned/logged meal session
CREATE TABLE IF NOT EXISTS scanned_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  total_calories NUMERIC NOT NULL DEFAULT 0,
  total_protein NUMERIC NOT NULL DEFAULT 0,
  total_carbs NUMERIC NOT NULL DEFAULT 0,
  total_fat NUMERIC NOT NULL DEFAULT 0,
  total_fiber NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. scanned_foods: individual food items within a scanned meal
CREATE TABLE IF NOT EXISTS scanned_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_meal_id UUID NOT NULL REFERENCES scanned_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity_grams NUMERIC NOT NULL DEFAULT 100,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scanned_meals_user_id ON scanned_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_meals_date ON scanned_meals(user_id, scan_date);
CREATE INDEX IF NOT EXISTS idx_scanned_foods_meal_id ON scanned_foods(scanned_meal_id);

-- RLS: Users can only read/write their own scanned meals
ALTER TABLE scanned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_foods ENABLE ROW LEVEL SECURITY;

-- scanned_meals policies
CREATE POLICY "Users can view their own scanned meals"
  ON scanned_meals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scanned meals"
  ON scanned_meals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scanned meals"
  ON scanned_meals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned meals"
  ON scanned_meals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- scanned_foods policies (access via scanned_meal ownership)
CREATE POLICY "Users can view their own scanned foods"
  ON scanned_foods FOR SELECT TO authenticated
  USING (
    scanned_meal_id IN (
      SELECT id FROM scanned_meals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own scanned foods"
  ON scanned_foods FOR INSERT TO authenticated
  WITH CHECK (
    scanned_meal_id IN (
      SELECT id FROM scanned_meals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own scanned foods"
  ON scanned_foods FOR UPDATE TO authenticated
  USING (
    scanned_meal_id IN (
      SELECT id FROM scanned_meals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    scanned_meal_id IN (
      SELECT id FROM scanned_meals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own scanned foods"
  ON scanned_foods FOR DELETE TO authenticated
  USING (
    scanned_meal_id IN (
      SELECT id FROM scanned_meals WHERE user_id = auth.uid()
    )
  );
