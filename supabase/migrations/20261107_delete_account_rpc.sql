-- ==============================================================================
-- Migration: Add delete user account RPC function and profile delete policy
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

-- 1. Create a secure RPC function to delete current user from auth.users & public tables
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_uid UUID;
  user_fam_id UUID;
BEGIN
  -- Get currently authenticated user ID from JWT context
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Niet geauthenticeerd / Not authenticated';
  END IF;

  -- Get family ID of the user before deleting profile
  SELECT family_id INTO user_fam_id FROM public.profiles WHERE id = current_uid;

  -- Release tasks claimed or requested by user back to open status
  UPDATE public.tasks
  SET claimed_by = NULL, status = 'open'
  WHERE claimed_by = current_uid AND status IN ('claimed', 'pending_approval');

  UPDATE public.tasks
  SET assigned_to = NULL
  WHERE assigned_to = current_uid;

  UPDATE public.tasks
  SET transfer_requested_by = NULL, transfer_requested_name = NULL
  WHERE transfer_requested_by = current_uid;

  -- Delete kid reward requests
  DELETE FROM public.reward_requests
  WHERE kid_id = current_uid;

  -- Delete profile record
  DELETE FROM public.profiles
  WHERE id = current_uid;

  -- If this user was the only member in the family, clean up the orphaned family
  IF user_fam_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE family_id = user_fam_id) THEN
      DELETE FROM public.families WHERE id = user_fam_id;
    END IF;
  END IF;

  -- Permanently delete user from auth.users (cascades sessions, refresh tokens & credentials)
  DELETE FROM auth.users
  WHERE id = current_uid;
END;
$$;

-- 2. Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- 3. Ensure profiles table allows users to delete their own profile directly
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
CREATE POLICY "Allow users to delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);


