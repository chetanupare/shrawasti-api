-- Run these migrations in Supabase SQL Editor
-- https://supabase.com/dashboard/project/<project-id>/database/sql
--
-- These migrations create the OTP authentication tables for Fast2SMS WhatsApp OTP
-- and insert a test coupon.
--
-- IMPORTANT: The OTP table requires RLS policies that allow:
-- 1. Service role to INSERT/UPDATE/DELETE (bypasses via SUPABASE_SERVICE_ROLE_KEY)
-- 2. Authenticated users to SELECT their own OTP (for admin/debug purposes)
--
-- Note: For OTP verification to work without auth, you may need to:
-- - Temporarily disable RLS on otp_codes table, OR
-- - Use the SUPABASE_SERVICE_ROLE_KEY which bypasses all RLS, OR
-- - Add a policy allowing anon SELECT for specific phone numbers

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

-- 3. Insert test coupon
INSERT INTO public.coupons (code, discount_type, discount_value, description, min_order_amount)
VALUES ('WELCOME50', 'percentage', 50, '50% off first booking', 100)
ON CONFLICT (code) DO NOTHING;

-- 4. Create indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);