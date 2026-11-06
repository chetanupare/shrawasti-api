# Shrawasti API Deployment Guide

## Database Migration Instructions

The API requires the following tables to be created in Supabase:

### 1. OTP Tables (Fast2SMS WhatsApp OTP)

#### Via Supabase SQL Editor

1. Go to **Supabase Dashboard** → your project → **SQL Editor**
2. Copy and paste the following SQL:

```sql
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

-- Allow authenticated users to read their own OTPs
CREATE POLICY IF NOT EXISTS "Users can view their own OTPs" ON public.otp_codes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to insert/update OTPs
CREATE POLICY IF NOT EXISTS "Service role can manage OTPs" ON public.otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- OTP rate limits table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits
CREATE POLICY IF NOT EXISTS "Service role can manage rate limits" ON public.otp_rate_limits
    FOR ALL USING (auth.role() = 'service_role');
```

3. Click **Run** to execute.

### 2. Grant API Access

After creating tables, you need to expose them to the Data API:

1. Go to **Supabase Dashboard** → **Integrations** → **Data API**
2. Ensure `otp_codes` and `otp_rate_limits` tables are visible to the `anon` and `authenticated` roles
3. RLS is already enabled above

### 3. Insert Test Coupon

```sql
INSERT INTO public.coupons (code, type, value, description, min_order_amount)
VALUES ('WELCOME50', 'percentage', 50, '50% off first booking', 100)
ON CONFLICT (code) DO NOTHING;
```

## Environment Variables

Set these in your Vercel dashboard or `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_your_key

JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_PHONE_NUMBER_ID=your_phone_number_id
FAST2SMS_TEMPLATE_ID=your_template_id
FAST2SMS_SENDER_NUMBER=+919168143290
```

## Fast2SMS Configuration Required

Before OTP functionality works:

1. Go to https://www.fast2sms.com
2. Login to your account
3. Go to **Settings** → **API**
4. Enable **Quick API Access** 
5. Get your API key from the dashboard
6. Copy the template configuration for WhatsApp templates

## API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/users` | GET | Get user by ID or phone | Yes (or phone param) |
| `/api/auth/otp` | POST | Request OTP | No |
| `/api/auth/verify-otp` | POST | Verify OTP | No |
| `/api/provider/profile` | GET | Get provider profile | Yes or phone param |
| `/api/coupons/apply` | POST | Apply coupon code | No |

## Testing the API

```bash
# Test users endpoint (phone-based lookup)
curl "https://your-api.vercel.app/api/users?phone=9876543210"

# Test OTP endpoint
curl -X POST "https://your-api.vercel.app/api/auth/otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "channel": "whatsapp"}'
```

## Run Migrations Script

If you have the database connection URL:

```bash
DATABASE_URL="postgresql://postgres.kwxjjqvpzxlbivptaath:your_password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" node run-migrations.js
```