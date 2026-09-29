import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://kwxjjqvpzxlbivptaath.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_8o3557JPUkLWUX31boEluA_tJihoHla";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.warn("Supabase environment variables missing in process.env. Using default project credentials.");
}

// Client for standard operations (RLS enforced if user token provided)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations that bypass RLS when service role key is configured
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase;

