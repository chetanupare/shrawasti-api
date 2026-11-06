const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kwxjjqvpzxlbivptaath:znuWVBq6szTllDuV@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

const sql = `
-- Create OTP tables for Fast2SMS WhatsApp authentication

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

-- Policy: Authenticated users can read their own OTPs
-- Note: SUPABASE_SERVICE_ROLE_KEY bypasses all RLS for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "otp_user_access" ON public.otp_codes;
CREATE POLICY "otp_user_access" ON public.otp_codes
    FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- 2. OTP rate limits table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
`;

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(sql);
    console.log('✅ Migrations completed successfully');

    // Verify tables exist
    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('otp_codes', 'otp_rate_limits')
      ORDER BY table_name
    `);
    console.log('Existing tables:', check.rows.map(r => r.table_name).join(', '));

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
