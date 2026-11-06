-- ==============================================================================
-- Migration: Automatic Profile Creation Trigger & Profiles RLS Configuration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

-- 1. Create a function that handles new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, points)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'kid'),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure Row-Level Security on profiles allows authenticated access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view profiles (needed for dashboard, claimant name, leaderboards)
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
CREATE POLICY "Allow users to insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users/parents to update profile points
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates"
ON public.profiles FOR UPDATE
TO authenticated
USING (true);

-- ==============================================================================
-- (Optional) If you have existing unconfirmed users you want to verify instantly:
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
-- ==============================================================================

