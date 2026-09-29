import pg from "pg";
const { Client } = pg;

const connectionString = "postgresql://postgres.kwxjjqvpzxlbivptaath:znuWVBq6szTllDuV@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  try {
    // 1. Idempotency Key in Bookings table
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
    `).catch(err => console.log("idempotency_key col error:", err.message));

    // 2. Prices JSONB in Services table
    await client.query(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '{}'::jsonb;
    `).catch(err => console.log("prices col error:", err.message));

    // 3. Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        discount_type TEXT DEFAULT 'fixed', -- 'fixed' or 'percentage'
        discount_value NUMERIC NOT NULL,
        min_order_amount NUMERIC DEFAULT 0,
        max_discount_amount NUMERIC DEFAULT 1000,
        max_redemptions INTEGER DEFAULT 100,
        times_redeemed INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 4. Subscription Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        benefits JSONB DEFAULT '[]'::jsonb,
        validity_days INTEGER DEFAULT 30,
        popular BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        prices JSONB DEFAULT '{}'::jsonb,
        base_price NUMERIC DEFAULT 999,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 5. User Subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        vehicle_id TEXT,
        plan_id TEXT NOT NULL,
        status TEXT DEFAULT 'active', -- 'pending', 'active', 'paused', 'expired', 'cancelled'
        billing_period TEXT DEFAULT 'monthly',
        current_period_start TIMESTAMPTZ DEFAULT NOW(),
        current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
        cancel_at_period_end BOOLEAN DEFAULT false,
        snapshot_price NUMERIC DEFAULT 0,
        snapshot_plan_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 6. Subscription Entitlements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_entitlements (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        subscription_id TEXT NOT NULL,
        entitlement_type TEXT DEFAULT 'wash',
        included_quantity INTEGER DEFAULT 4,
        reserved_quantity INTEGER DEFAULT 0,
        used_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE subscription_entitlements DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 7. Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        booking_id TEXT,
        user_id TEXT,
        provider_id TEXT,
        service_id TEXT,
        rating INTEGER NOT NULL DEFAULT 5,
        comment TEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 8. Device Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT,
        push_token TEXT NOT NULL,
        platform TEXT DEFAULT 'expo',
        device_model TEXT,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE device_tokens DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    // 9. Notifications / Broadcast Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        target_audience TEXT DEFAULT 'all',
        recipients_count INTEGER DEFAULT 0,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE broadcast_notifications DISABLE ROW LEVEL SECURITY;`).catch(() => {});

    console.log("Full Supabase schema initialized successfully!");

    // Seed sample coupons if empty
    const couponCheck = await client.query(`SELECT COUNT(*) FROM coupons;`);
    if (parseInt(couponCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, max_redemptions, is_active)
        VALUES
        ('WELCOME100', 'Flat ₹100 off on your first service booking', 'fixed', 100, 299, 100, 500, true),
        ('SHRAWASTI20', '20% off on all car interior & exterior detailing', 'percentage', 20, 499, 250, 200, true),
        ('BIKEWASH50', 'Flat ₹50 off on bike & scooter wash', 'fixed', 50, 149, 50, 300, true);
      `);
      console.log("Seeded sample coupons.");
    }

    // Seed sample subscription plans if empty
    const planCheck = await client.query(`SELECT COUNT(*) FROM subscription_plans;`);
    if (parseInt(planCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO subscription_plans (name, description, benefits, validity_days, popular, base_price, is_active, prices)
        VALUES
        ('Shrawasti CarePass Standard', '4 Premium Washes per month with exterior foam bath', '["4 Washes / Month", "Free Tyre Polish", "Priority Booking", "10% Off Addons"]'::jsonb, 30, true, 899, true, '{"hatchback": 799, "sedan": 899, "suv": 999, "bike": 499}'::jsonb),
        ('Shrawasti CarePass Unlimited', 'Unlimited foam washes + 1 interior spa session', '["Unlimited Washes", "1 Free Interior Spa", "Dedicated Provider", "Zero Cancellation Fee"]'::jsonb, 30, false, 1699, true, '{"hatchback": 1499, "sedan": 1699, "suv": 1999, "bike": 899}'::jsonb);
      `);
      console.log("Seeded sample subscription plans.");
    }

    // Seed sample reviews if empty
    const reviewCheck = await client.query(`SELECT COUNT(*) FROM reviews;`);
    if (parseInt(reviewCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO reviews (rating, comment, is_published)
        VALUES
        (5, 'Excellent service! Car looks brand new after foam bath.', true),
        (5, 'Provider arrived on time and did thorough cleaning.', true),
        (4, 'Great bike wash, very polite staff.', true);
      `);
      console.log("Seeded sample reviews.");
    }

  } catch (e) {
    console.error("Error executing schema setup:", e);
  } finally {
    await client.end();
  }
}

run();
