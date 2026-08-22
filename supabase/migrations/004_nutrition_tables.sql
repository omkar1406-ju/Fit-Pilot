-- Nutrition tables
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. nutrition_preferences: user's nutrition setup
CREATE TABLE IF NOT EXISTS nutrition_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  occupation TEXT NOT NULL,
  diet TEXT NOT NULL,
  daily_budget_inr NUMERIC NOT NULL,
  allergies TEXT DEFAULT '',
  foods_to_avoid TEXT DEFAULT '',
  meals_per_day INTEGER NOT NULL DEFAULT 4,
  completed BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. nutrition_plans: one active plan per user (weekly)
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_calories NUMERIC NOT NULL,
  target_protein NUMERIC NOT NULL,
  target_carbs NUMERIC NOT NULL,
  target_fat NUMERIC NOT NULL,
  target_fiber NUMERIC NOT NULL,
  estimated_cost_inr NUMERIC NOT NULL,
  budget_inr NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. nutrition_meals: each day in a plan
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  day_date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. nutrition_foods: foods within a meal slot
CREATE TABLE IF NOT EXISTS nutrition_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nutrition_meal_id UUID NOT NULL REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC NOT NULL,
  meal_type TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nutrition_prefs_user_id ON nutrition_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_id ON nutrition_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_active ON nutrition_plans(user_id, active);
CREATE INDEX IF NOT EXISTS idx_nutrition_meals_plan_id ON nutrition_meals(nutrition_plan_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_meals_date ON nutrition_meals(day_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_foods_meal_id ON nutrition_foods(nutrition_meal_id);

-- RLS: Users can only read/write their own nutrition data
ALTER TABLE nutrition_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_foods ENABLE ROW LEVEL SECURITY;

-- nutrition_preferences policies
CREATE POLICY "Users can view their own nutrition preferences"
  ON nutrition_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition preferences"
  ON nutrition_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition preferences"
  ON nutrition_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition preferences"
  ON nutrition_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- nutrition_plans policies
CREATE POLICY "Users can view their own nutrition plans"
  ON nutrition_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition plans"
  ON nutrition_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition plans"
  ON nutrition_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition plans"
  ON nutrition_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- nutrition_meals policies (access via plan ownership)
CREATE POLICY "Users can view their own nutrition meals"
  ON nutrition_meals FOR SELECT TO authenticated
  USING (
    nutrition_plan_id IN (
      SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own nutrition meals"
  ON nutrition_meals FOR INSERT TO authenticated
  WITH CHECK (
    nutrition_plan_id IN (
      SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own nutrition meals"
  ON nutrition_meals FOR UPDATE TO authenticated
  USING (
    nutrition_plan_id IN (
      SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    nutrition_plan_id IN (
      SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own nutrition meals"
  ON nutrition_meals FOR DELETE TO authenticated
  USING (
    nutrition_plan_id IN (
      SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
    )
  );

-- nutrition_foods policies (access via meal -> plan ownership)
CREATE POLICY "Users can view their own nutrition foods"
  ON nutrition_foods FOR SELECT TO authenticated
  USING (
    nutrition_meal_id IN (
      SELECT nm.id FROM nutrition_meals nm
      JOIN nutrition_plans np ON nm.nutrition_plan_id = np.id
      WHERE np.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own nutrition foods"
  ON nutrition_foods FOR INSERT TO authenticated
  WITH CHECK (
    nutrition_meal_id IN (
      SELECT nm.id FROM nutrition_meals nm
      JOIN nutrition_plans np ON nm.nutrition_plan_id = np.id
      WHERE np.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own nutrition foods"
  ON nutrition_foods FOR UPDATE TO authenticated
  USING (
    nutrition_meal_id IN (
      SELECT nm.id FROM nutrition_meals nm
      JOIN nutrition_plans np ON nm.nutrition_plan_id = np.id
      WHERE np.user_id = auth.uid()
    )
  )
  WITH CHECK (
    nutrition_meal_id IN (
      SELECT nm.id FROM nutrition_meals nm
      JOIN nutrition_plans np ON nm.nutrition_plan_id = np.id
      WHERE np.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own nutrition foods"
  ON nutrition_foods FOR DELETE TO authenticated
  USING (
    nutrition_meal_id IN (
      SELECT nm.id FROM nutrition_meals nm
      JOIN nutrition_plans np ON nm.nutrition_plan_id = np.id
      WHERE np.user_id = auth.uid()
    )
  );
