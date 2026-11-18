-- App users live in public.users. payments.user_id pointed at auth.users,
-- so a booking payment insert failed the foreign key.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

UPDATE public.payments
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.payments.user_id);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
