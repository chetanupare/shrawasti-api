-- Create providers table for technicians/service providers
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    profile_image TEXT,
    rating NUMERIC(2,1) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_phone ON public.providers(phone);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_location ON public.providers USING GIN (
    CASE WHEN current_lat IS NOT NULL AND current_lng IS NOT NULL THEN 
        ST_MakePoint(current_lng, current_lat)::geometry 
    ELSE NULL END
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage providers
CREATE POLICY IF NOT EXISTS "Allow admin to manage providers" ON public.providers
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Policy: Providers can read their own data
CREATE POLICY IF NOT EXISTS "Allow providers to read their own data" ON public.providers
    FOR SELECT USING (auth.uid() = id);

-- Create booking_slots table for appointment scheduling
CREATE TABLE IF NOT EXISTS public.booking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_time TEXT NOT NULL UNIQUE,
    max_capacity INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_slots_active ON public.booking_slots(is_active);

ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for active slots
CREATE POLICY IF NOT EXISTS "Allow public read access for active slots" ON public.booking_slots
    FOR SELECT USING (is_active = true);

-- Policy: Admin can manage slots
CREATE POLICY IF NOT EXISTS "Allow admin to manage slots" ON public.booking_slots
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for providers
DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for saved_locations
DROP TRIGGER IF EXISTS update_saved_locations_updated_at ON public.saved_locations;
CREATE TRIGGER update_saved_locations_updated_at
    BEFORE UPDATE ON public.saved_locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();