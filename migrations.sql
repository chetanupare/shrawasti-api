-- Run these migrations in Supabase SQL Editor
-- https://supabase.com/dashboard/project/<project-id>/database/sql

-- 1. OTP codes table
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

CREATE POLICY IF NOT EXISTS "Users can view their own OTPs" ON public.otp_codes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Service role can manage OTPs" ON public.otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- 2. OTP rate limits table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can manage rate limits" ON public.otp_rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read their own profile" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 4. Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free')),
    value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    description TEXT,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Coupons are public read" ON public.coupons
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY IF NOT EXISTS "Service role can manage coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    profile_image TEXT,
    rating NUMERIC DEFAULT 5.0,
    total_jobs INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    skills TEXT[],
    experience_years INTEGER,
    bio TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Providers are public read" ON public.providers
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create provider profile" ON public.providers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

CREATE POLICY IF NOT EXISTS "Service role can manage providers" ON public.providers
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    service_ids UUID[],
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    actual_start_at TIMESTAMPTZ,
    actual_end_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_id TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    service_order JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can manage bookings" ON public.bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);

-- Insert a test coupon if not exists
INSERT INTO public.coupons (code, type, value, description, min_order_amount)
VALUES ('WELCOME50', 'percentage', 50, '50% off first booking', 100)
ON CONFLICT (code) DO NOTHING;