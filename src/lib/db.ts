// @ts-ignore
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.kwxjjqvpzxlbivptaath:znuWVBq6szTllDuV@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export async function queryProviderByPhoneOrId(providerIdOrPhone: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerIdOrPhone);
  const cleanDigits = providerIdOrPhone.replace(/\D/g, '');
  const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

  if (isUuid) {
    const res = await pool.query('SELECT * FROM public.providers WHERE id = $1 LIMIT 1', [providerIdOrPhone]);
    return res.rows[0] || null;
  }

  if (last10.length === 10) {
    const res = await pool.query(
      `SELECT * FROM public.providers 
       WHERE REPLACE(REPLACE(phone, ' ', ''), '+91', '') = $1 
          OR phone ILIKE $2 
       LIMIT 1`,
      [last10, `%${last10}%`]
    );
    return res.rows[0] || null;
  }

  return null;
}
