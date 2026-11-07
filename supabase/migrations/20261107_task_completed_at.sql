-- ==============================================================================
-- Migration: Add completed_at column to tasks for 24-hour auto-disappearance
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill completed_at with created_at for any currently completed tasks
UPDATE public.tasks 
SET completed_at = created_at 
WHERE status = 'completed' AND completed_at IS NULL;
