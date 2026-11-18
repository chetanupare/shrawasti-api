ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
  ADD COLUMN IF NOT EXISTS body_type TEXT;

NOTIFY pgrst, 'reload schema';
