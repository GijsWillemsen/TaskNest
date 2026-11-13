-- ==============================================================================
-- Migration: Add Notifications Table and Realtime Replication
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- specific recipient or NULL
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT DEFAULT NULL,
  target_role TEXT DEFAULT NULL CHECK (target_role IN ('parent', 'kid', 'all')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task_completed', 'task_approved', 'task_assigned', 'transfer_requested', 'reward_requested', 'reward_approved'
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row-Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow family read notifications" ON public.notifications;
CREATE POLICY "Allow family read notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "Allow family insert notifications" ON public.notifications;
CREATE POLICY "Allow family insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "Allow family update notifications" ON public.notifications;
CREATE POLICY "Allow family update notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "Allow family delete notifications" ON public.notifications;
CREATE POLICY "Allow family delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()) OR public.get_user_family_id(auth.uid()) IS NULL);

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

