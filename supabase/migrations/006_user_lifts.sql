-- User lifts table for Strength Profile
-- Run this in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS user_lifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 1,
  sets INTEGER,
  extra_weight_kg NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_lifts_user_id ON user_lifts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lifts_exercise ON user_lifts(user_id, exercise_id);

-- RLS: Users can only read/write their own lifts
ALTER TABLE user_lifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lifts"
  ON user_lifts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lifts"
  ON user_lifts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lifts"
  ON user_lifts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lifts"
  ON user_lifts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
