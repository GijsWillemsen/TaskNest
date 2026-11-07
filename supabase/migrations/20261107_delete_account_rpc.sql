-- ==============================================================================
-- Migration: Add delete user account RPC function and profile delete policy
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

-- 1. Create a secure RPC function to delete current user and cascade data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  current_uid UUID;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NOT NULL THEN
    -- Release tasks claimed or requested by user
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

    -- Delete user from auth.users (cascades sessions & tokens)
    DELETE FROM auth.users
    WHERE id = current_uid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- 3. Ensure profiles table allows users to delete their own profile directly
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
CREATE POLICY "Allow users to delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);
