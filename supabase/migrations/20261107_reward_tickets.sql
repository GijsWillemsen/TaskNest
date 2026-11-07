-- Migration to update reward_requests for ticket workflow
ALTER TABLE public.reward_requests DROP CONSTRAINT IF EXISTS reward_requests_status_check;
ALTER TABLE public.reward_requests ADD CONSTRAINT reward_requests_status_check CHECK (status IN ('available', 'pending', 'approved', 'rejected', 'used'));
ALTER TABLE public.reward_requests ALTER COLUMN status SET DEFAULT 'available';

