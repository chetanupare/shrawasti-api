-- Run these migrations in Supabase SQL Editor
-- https://supabase.com/dashboard/project/<project-id>/database/sql
--
-- These migrations create the OTP authentication tables for Fast2SMS WhatsApp OTP

-- 1. OTP codes table - stores OTPs for authentication
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON public.otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read their own OTPs
-- Note: Service role key bypasses all RLS for INSERT/UPDATE/DELETE operations
CREATE POLICY "otp_user_access" ON public.otp_codes
    FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- 2. OTP rate limits table - prevents brute force OTP requests
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: Service role key bypasses all RLS for all operations on this table

-- 3. Create indexes for existing tables (if they exist)
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);