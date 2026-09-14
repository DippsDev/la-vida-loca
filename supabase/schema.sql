-- La Vida LOCA — requests table
-- Run this in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  note text,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests (status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON public.requests (created_at DESC);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;

-- Admin sign-in: create users in Supabase Auth (Authentication → Users)
-- and list their emails in NUXT_PUBLIC_ADMIN_EMAILS.

-- Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a request"
  ON public.requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read requests"
  ON public.requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update status"
  ON public.requests
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
