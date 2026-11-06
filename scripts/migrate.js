const { Client } = require('pg');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(`
      ALTER TABLE public.bookings
      ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
      ADD COLUMN IF NOT EXISTS cancelled_by uuid,
      ADD COLUMN IF NOT EXISTS cancellation_reason text;
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
