-- Migration: Add recurrence columns to tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurrence_time TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_day TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL;

