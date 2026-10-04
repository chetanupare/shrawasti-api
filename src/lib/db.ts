// @ts-ignore
import { Pool } from 'pg';
import { supabase } from '@/lib/supabase';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.kwxjjqvpzxlbivptaath:znuWVBq6szTllDuV@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export async function queryProviderByPhoneOrId(providerIdOrPhone: string) {
  if (!providerIdOrPhone) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerIdOrPhone);
  const cleanDigits = providerIdOrPhone.replace(/\D/g, '');
  const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

  // 1. Direct PG Pool lookup with regexp_replace
  try {
    if (isUuid) {
      const res = await pool.query('SELECT * FROM public.providers WHERE id = $1 LIMIT 1', [providerIdOrPhone]);
      if (res.rows[0]) return res.rows[0];
    }

    if (last10.length === 10) {
      const res = await pool.query(
        `SELECT * FROM public.providers WHERE regexp_replace(phone, '\\D', '', 'g') LIKE $1 LIMIT 1`,
        [`%${last10}%`]
      );
      if (res.rows[0]) return res.rows[0];
    }
  } catch (err: any) {
    console.warn('[queryProviderByPhoneOrId Pool Error]:', err?.message || err);
  }

  // 2. Supabase client fallback with .in() array and .ilike()
  try {
    if (isUuid) {
      const { data } = await supabase.from('providers').select('*').eq('id', providerIdOrPhone).maybeSingle();
      if (data) return data;
    }

    if (last10.length === 10) {
      const p1 = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
      const p2 = `+91${last10}`;
      const p3 = last10;

      // Try exact array match
      const { data: inData } = await supabase
        .from('providers')
        .select('*')
        .in('phone', [p1, p2, p3])
        .maybeSingle();
      if (inData) return inData;

      // Try substring match on last 5 digits
      const last5 = last10.slice(-5);
      const { data: ilikeData } = await supabase
        .from('providers')
        .select('*')
        .ilike('phone', `%${last5}%`)
        .maybeSingle();
      if (ilikeData) return ilikeData;
    }
  } catch (err: any) {
    console.warn('[queryProviderByPhoneOrId Supabase Error]:', err?.message || err);
  }

  return null;
}
