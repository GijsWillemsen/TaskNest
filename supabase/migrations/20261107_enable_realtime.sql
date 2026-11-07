-- ==============================================================================
-- Migration: Enable Realtime Replication for instant cross-device updates
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lcqywcpiudrcyggccknw/sql
-- ==============================================================================

-- Enable Postgres replication for real-time broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.families;
