import pg from "pg";
const { Client } = pg;

const connectionString = "postgresql://postgres.kwxjjqvpzxlbivptaath:znuWVBq6szTllDuV@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  try {
    // 1. Create table booking_slots if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slot_time TEXT NOT NULL,
        max_capacity INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(async (e) => {
      console.log("Creating table with fallback UUID:", e.message);
      await client.query(`
        CREATE TABLE IF NOT EXISTS booking_slots (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          slot_time TEXT NOT NULL,
          max_capacity INTEGER DEFAULT 10,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    });

    // 2. Add columns if missing
    await client.query(`ALTER TABLE booking_slots ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 10;`);
    await client.query(`ALTER TABLE booking_slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
    await client.query(`ALTER TABLE booking_slots ADD COLUMN IF NOT EXISTS slot_time TEXT;`);

    console.log("Schema updated for booking_slots.");

    // 3. Disable RLS or grant policy for public access if needed
    await client.query(`ALTER TABLE booking_slots DISABLE ROW LEVEL SECURITY;`).catch((err) => console.log("RLS warning:", err.message));

    // 4. Check current slots count
    const res = await client.query(`SELECT * FROM booking_slots;`);
    console.log(`Found ${res.rows.length} existing slots in database.`);

    if (res.rows.length === 0) {
      console.log("Seeding default slots with capacity...");
      const defaultSlots = [
        { slot_time: "09:00 AM - 10:00 AM", max_capacity: 10, is_active: true },
        { slot_time: "10:00 AM - 11:00 AM", max_capacity: 10, is_active: true },
        { slot_time: "11:00 AM - 12:00 PM", max_capacity: 12, is_active: true },
        { slot_time: "12:00 PM - 01:00 PM", max_capacity: 8, is_active: true },
        { slot_time: "02:00 PM - 03:00 PM", max_capacity: 15, is_active: true },
        { slot_time: "03:00 PM - 04:00 PM", max_capacity: 10, is_active: true },
        { slot_time: "04:00 PM - 05:00 PM", max_capacity: 10, is_active: true },
        { slot_time: "05:00 PM - 06:00 PM", max_capacity: 6, is_active: true },
      ];

      for (const s of defaultSlots) {
        await client.query(
          `INSERT INTO booking_slots (slot_time, max_capacity, is_active) VALUES ($1, $2, $3);`,
          [s.slot_time, s.max_capacity, s.is_active]
        );
      }
      console.log("Seeded default slots with capacity!");
    } else {
      // Update any null max_capacity to 10
      await client.query(`UPDATE booking_slots SET max_capacity = 10 WHERE max_capacity IS NULL;`);
      await client.query(`UPDATE booking_slots SET is_active = true WHERE is_active IS NULL;`);
      console.log("Updated existing slots with default capacity of 10.");
    }

    const finalRes = await client.query(`SELECT id, slot_time, max_capacity, is_active FROM booking_slots;`);
    console.log("Current Slots in Supabase DB:");
    console.table(finalRes.rows);

  } catch (e) {
    console.error("Error executing script:", e);
  } finally {
    await client.end();
  }
}

run();
