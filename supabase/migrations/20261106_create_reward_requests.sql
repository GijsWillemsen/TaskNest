-- Migration: Create reward_requests table and configure RLS
-- Run this in your Supabase SQL Editor if not already created

-- 1. Create the reward_requests table
CREATE TABLE IF NOT EXISTS public.reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

-- 3. Row-Level Security Policies

-- All authenticated family members can view reward requests
CREATE POLICY "Allow authenticated read reward_requests"
ON public.reward_requests FOR SELECT
TO authenticated
USING (true);

-- Kids can insert reward requests for themselves
CREATE POLICY "Allow authenticated insert reward_requests"
ON public.reward_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = kid_id);

-- Parents can update request status (approve or reject)
CREATE POLICY "Allow authenticated update reward_requests"
ON public.reward_requests FOR UPDATE
TO authenticated
USING (true);

-- Parents can delete requests
CREATE POLICY "Allow authenticated delete reward_requests"
ON public.reward_requests FOR DELETE
TO authenticated
USING (true);
