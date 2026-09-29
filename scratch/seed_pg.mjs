import pg from 'pg';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
let connectionString = '';
envFile.split('\n').forEach((line) => {
  if (line.startsWith('DATABASE_URL=')) {
    connectionString = line.replace('DATABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
  }
});

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL directly!');

  // 1. Ensure RLS bypass policy for services table
  await client.query(`
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public full access to services" ON public.services;
    CREATE POLICY "Allow public full access to services" ON public.services FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('Services table RLS policies updated to full access.');

  // 2. Insert 2W and 4W services
  const sql = `
    INSERT INTO public.services (name, description, category, base_price, duration_minutes, is_active, popular)
    VALUES
      ('2W Bike Quick Pressure Wash', 'Complete two-wheeler pressure washing, chain lube, and mirror wipe for Scooter.', '2w_wash', 199, 25, true, true),
      ('2W Premium Bike Foam & Polish', 'Snow foam bath, Teflon tank polish, engine degreasing, and chain lube for Cruiser.', '2w_wash', 349, 40, true, true),
      ('2W Ceramic Shield Coating', 'Hydrophobic 9H ceramic coating for helmet visor, bike tank, and alloy wheels for Sports bike.', '2w_wash', 699, 60, true, false),
      ('4W Hatchback Express Wash', 'Complete exterior pressure wash, micro-fiber wipe down, and floor mat cleaning for Hatchback.', '4w_wash', 399, 40, true, false),
      ('4W Sedan & SUV Premium Foam Bath', 'pH-neutral snow foam bath, high-gloss wax sealant, interior vacuum & dashboard polish for SUV.', '4w_wash', 699, 60, true, true),
      ('4W Full Interior Spa & Sanitization', 'Steam extraction cleaning of seats, carpets, headliner, and anti-bacterial fogging for Sedan.', '4w_wash', 1199, 90, true, true),
      ('4W Tyre & Underbody Degreasing', 'High pressure underbody chassis wash and non-slung tire hydrophobic coating.', 'add_on', 299, 20, true, false)
    ON CONFLICT DO NOTHING;
  `;

  await client.query(sql);
  console.log('Successfully inserted 2W Bike and 4W Car services into PostgreSQL!');

  const res = await client.query('SELECT count(*) FROM public.services;');
  console.log('Total services in DB:', res.rows[0].count);

  await client.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
