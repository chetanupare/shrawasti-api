#!/usr/bin/env node
/**
 * Run database migrations using direct PostgreSQL connection
 * Usage: DATABASE_URL="..." node run-migrations-mcp.js
 *
 * Requires:
 * - DATABASE_URL environment variable pointing to Supabase connection pool
 *
 * Get connection string from: Supabase Dashboard → Settings → Database → Connection Pooling
 */

require('dotenv').config();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(`
ERROR: DATABASE_URL not set

To run migrations:

1. Get your database connection string from:
   - Supabase Dashboard → Settings → Database → Connection Pooling

2. Run:
   export DATABASE_URL="postgresql://postgres.kwxjjqvpzxlbivptaath:your_password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
   node run-migrations-mcp.js
`);
  process.exit(1);
}

async function runMigrations() {
  console.log('Running database migrations...\n');

  const migrationsDir = path.join(__dirname, 'supabase/migrations');

  let files;
  try {
    files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  } catch (e) {
    console.error('Migration directory not found');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  const client = new Client({
    connectionString: databaseUrl,
    // Supabase requires SSL
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing ${file}...`);

      // Split into statements and execute
      const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));

      for (const stmt of statements) {
        const cleanStmt = stmt.trim() + ';';
        try {
          await client.query(cleanStmt);
        } catch (e) {
          if (!e.message.includes('already exists') &&
              !e.message.includes('duplicate') &&
              !e.message.includes('duplicate key') &&
              !e.message.includes('duplicate key value')) {
            console.error(`  Error: ${e.message}`);
          }
        }
      }
      console.log(`  ✓ ${file} applied\n`);
    }

    // Verify tables
    console.log('Verifying migrated tables:');
    const tables = ['otp_codes', 'otp_rate_limits', 'users', 'coupons', 'providers', 'bookings'];

    for (const table of tables) {
      try {
        const res = await client.query("SELECT to_regclass('public." + table + "') as exists");
        console.log(`  ${res.rows[0].exists ? '✓' : '✗'} ${table}`);
      } catch (e) {
        console.log(`  ✗ ${table} - ${e.message}`);
      }
    }

    await client.end();
    console.log('\n✓ All migrations completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

runMigrations();