#!/usr/bin/env node
/**
 * Run database migrations for Supabase
 * Usage: DATABASE_URL="..." node run-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set it to your Supabase connection string:');
  console.error('  export DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"');
  console.error('');
  console.error('You can find this in Supabase Dashboard > Settings > Database > Connection Pooling');
  process.exit(1);
}

async function runMigrations() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    // Read and execute migrations SQL
    const sqlPath = path.join(__dirname, 'migrations.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('Executing migrations from migrations.sql...');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));

      for (const stmt of statements) {
        try {
          const cleanStmt = stmt.trim() + ';';
          console.log('Executing:', cleanStmt.substring(0, 100) + (cleanStmt.length > 100 ? '...' : ''));
          await client.query(cleanStmt);
        } catch (e) {
          console.error('Statement error:', e.message);
        }
      }
      console.log('\nMigrations executed!');
    }

    // Verify tables exist
    console.log('\nVerifying tables...');
    const tables = ['otp_codes', 'otp_rate_limits', 'users', 'coupons', 'providers', 'bookings'];
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT to_regclass('public.${table}') as exists`);
        if (res.rows[0].exists) {
          console.log(`✓ Table ${table} exists`);
        } else {
          console.log(`✗ Table ${table} does not exist`);
        }
      } catch (e) {
        console.log(`✗ Error checking ${table}:`, e.message);
      }
    }

    await client.end();
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

runMigrations();