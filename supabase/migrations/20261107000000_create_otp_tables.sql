-- OTP codes table for authentication
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

CREATE POLICY IF NOT EXISTS "otp_user_access" ON public.otp_codes
    FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- OTP rate limits table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
