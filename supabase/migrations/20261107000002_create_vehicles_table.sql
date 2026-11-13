-- Create vehicles table for user-owned vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    body_type TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    registration_number TEXT,
    nickname TEXT,
    color TEXT,
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);

-- Enable RLS for vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own vehicles
CREATE POLICY "Allow users to read their own vehicles" ON public.vehicles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own vehicles
CREATE POLICY "Allow users to insert their own vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vehicles
CREATE POLICY "Allow users to update their own vehicles" ON public.vehicles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own vehicles
CREATE POLICY "Allow users to delete their own vehicles" ON public.vehicles
    FOR DELETE USING (auth.uid() = user_id);

-- Create saved_locations table for user locations
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    building_name TEXT,
    house_number TEXT,
    landmark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);

-- Enable RLS for saved_locations
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own saved locations
CREATE POLICY "Allow users to read their own locations" ON public.saved_locations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own locations
CREATE POLICY "Allow users to insert their own locations" ON public.saved_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own locations
CREATE POLICY "Allow users to update their own locations" ON public.saved_locations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own locations
CREATE POLICY "Allow users to delete their own locations" ON public.saved_locations
    FOR DELETE USING (auth.uid() = user_id);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
    location_snapshot JSONB,
    vehicle_snapshot JSONB,
    services JSONB,
    schedule_date DATE NOT NULL,
    schedule_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    price NUMERIC(10,2),
    discount_amount NUMERIC(10,2) DEFAULT 0,
    final_price NUMERIC(10,2),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id and status for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own bookings
CREATE POLICY "Allow users to read their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id);

-- Policy: Users can create bookings
CREATE POLICY "Allow users to create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their bookings (only if not completed)
CREATE POLICY "Allow users to update their bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id AND status NOT IN ('completed', 'cancelled'));

-- Policy: Users can delete their own bookings (only if pending)
CREATE POLICY "Allow users to delete their bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all reviews
CREATE POLICY "Allow public read access for reviews" ON public.reviews
    FOR SELECT USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Allow users to insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_amount NUMERIC(10,2) NOT NULL,
    max_discount NUMERIC(10,2),
    min_order_value NUMERIC(10,2) DEFAULT 0,
    usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- Enable RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read active coupons
CREATE POLICY "Allow public read access for coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Admin can manage coupons
CREATE POLICY "Allow admin to manage coupons" ON public.coupons
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    benefits JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on is_active
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Enable RLS for subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read active plans
CREATE POLICY "Allow public read access for subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id and status
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Enable RLS for user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscriptions
CREATE POLICY "Allow users to read their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create subscriptions
CREATE POLICY "Allow users to create subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES public.providers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id and status
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own tickets
CREATE POLICY "Allow users to read their own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create tickets
CREATE POLICY "Allow users to create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);