-- OTP codes table for authentication
CREATE TABLE public.otp_codes (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (phone)
);

CREATE INDEX idx_otp_codes_phone ON public.otp_codes(phone);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own OTPs
CREATE POLICY "Users can view their own OTPs" ON public.otp_codes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to insert/update OTPs
CREATE POLICY "Service role can manage OTPs" ON public.otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- OTP rate limits table
CREATE TABLE public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits
CREATE POLICY "Service role can manage rate limits" ON public.otp_rate_limits
    FOR ALL USING (auth.role() = 'service_role');