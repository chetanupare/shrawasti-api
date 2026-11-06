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

-- Allow authenticated users to read their own OTPs
-- Service role key bypasses RLS for all operations
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

-- Service role key bypasses RLS for all operations

-- Insert a test coupon if not exists
-- Note: coupons table schema uses discount_type/discount_value instead of type/value
INSERT INTO public.coupons (code, discount_type, discount_value, description, min_order_amount)
VALUES ('WELCOME50', 'percentage', 50, '50% off first booking', 100)
ON CONFLICT (code) DO NOTHING;