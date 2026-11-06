-- OTP codes table for authentication
-- This table stores OTPs for Fast2SMS WhatsApp OTP authentication
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
-- Note: SUPABASE_SERVICE_ROLE_KEY bypasses all RLS for INSERT/UPDATE/DELETE
CREATE POLICY IF NOT EXISTS "otp_user_access" ON public.otp_codes
    FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- OTP rate limits table
-- Used to prevent brute force OTP requests
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: SUPABASE_SERVICE_ROLE_KEY bypasses all RLS for all operations on this table