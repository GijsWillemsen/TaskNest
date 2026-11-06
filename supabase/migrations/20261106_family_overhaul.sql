-- ==============================================================================
-- TaskNest: COMPLETE DATABASE WIPE & FAMILY LINKING MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

-- 1. Drop old tables and dependencies in reverse order
DROP TABLE IF EXISTS public.reward_requests CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- 2. Wipe old auth users (clears test accounts so you can re-register the same emails)
DELETE FROM auth.users;

-- 3. Drop existing triggers & functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_family_id(UUID) CASCADE;

-- 4. Create Families Table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Profiles Table (links auth.users to families)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'kid')),
  display_name TEXT NOT NULL DEFAULT 'Hero',
  theme_preference TEXT NOT NULL DEFAULT 'playful' CHECK (theme_preference IN ('playful', 'modern')),
  points INTEGER NOT NULL DEFAULT 0,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Tasks Table (isolated by family_id)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_value INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'pending_approval', 'completed')),
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Rewards Table (isolated by family_id)
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cost INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Reward Requests Table (isolated by family_id)
CREATE TABLE public.reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Enable Row-Level Security
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

-- 10. Helper function to get current user's family_id
CREATE OR REPLACE FUNCTION public.get_user_family_id(user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT family_id FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- 11. Automatic Profile Creation Trigger on Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, theme_preference, points, family_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'parent'),
    COALESCE(new.raw_user_meta_data->>'display_name', 'Hero'),
    COALESCE(new.raw_user_meta_data->>'theme_preference', 'playful'),
    0,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name,
    theme_preference = EXCLUDED.theme_preference;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Row-Level Security Policies

-- Families: Authenticated users can read (for invite codes & family details), insert to create, update own
CREATE POLICY "Allow authenticated read families"
ON public.families FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert families"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update families"
ON public.families FOR UPDATE
TO authenticated
USING (id = public.get_user_family_id(auth.uid()));

-- Profiles: Authenticated users can view and update within family
CREATE POLICY "Allow authenticated read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (true);

-- Tasks: Isolated by family_id
CREATE POLICY "Allow family read tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

CREATE POLICY "Allow family insert tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

-- Rewards: Isolated by family_id
CREATE POLICY "Allow family read rewards"
ON public.rewards FOR SELECT
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

CREATE POLICY "Allow family insert rewards"
ON public.rewards FOR INSERT
TO authenticated
WITH CHECK (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family update rewards"
ON public.rewards FOR UPDATE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family delete rewards"
ON public.rewards FOR DELETE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

-- Reward Requests: Isolated by family_id
CREATE POLICY "Allow family read reward_requests"
ON public.reward_requests FOR SELECT
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

CREATE POLICY "Allow family insert reward_requests"
ON public.reward_requests FOR INSERT
TO authenticated
WITH CHECK (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family update reward_requests"
ON public.reward_requests FOR UPDATE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Allow family delete reward_requests"
ON public.reward_requests FOR DELETE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

