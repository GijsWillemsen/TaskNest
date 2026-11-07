-- Migration: Add task transfer requests and eligible assignees pool
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS transfer_requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_requested_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS eligible_assignees JSONB DEFAULT NULL;

