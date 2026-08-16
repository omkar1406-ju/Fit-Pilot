-- Add name column to profiles table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
