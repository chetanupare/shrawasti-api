-- Ensure core tables exist for authentication and business logic
-- This migration creates tables that are referenced but may not exist in fresh Supabase projects

-- Users table - stores user profiles synced with auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Auth users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read their own profile" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can update their profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Service role can manage users
CREATE POLICY IF NOT EXISTS "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Coupons table
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

-- Enable RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons
CREATE POLICY IF NOT EXISTS "Coupons are public read" ON public.coupons
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Service role can manage coupons
CREATE POLICY IF NOT EXISTS "Service role can manage coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

-- Providers table
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

-- Enable RLS for providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Anyone can read providers
CREATE POLICY IF NOT EXISTS "Providers are public read" ON public.providers
    FOR SELECT USING (true);

-- Authenticated users can insert their provider profile
CREATE POLICY IF NOT EXISTS "Users can create provider profile" ON public.providers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- Service role can manage all providers
CREATE POLICY IF NOT EXISTS "Service role can manage providers" ON public.providers
    FOR ALL USING (auth.role() = 'service_role');

-- Bookings (jobs) table
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

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Service role can manage all bookings
CREATE POLICY IF NOT EXISTS "Service role can manage bookings" ON public.bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);