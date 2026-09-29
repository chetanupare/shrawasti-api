import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
}

// Fallback placeholders for build-time safety to prevent module evaluation crashes during 'next build'
const validUrl = supabaseUrl || "https://placeholder.supabase.co";
const validAnonKey = supabaseAnonKey || "placeholder";

// Client for standard operations (RLS enforced if user token provided)
export const supabase = createClient(validUrl, validAnonKey);

// Admin client for backend operations that bypass RLS when service role key is configured
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(validUrl, supabaseServiceRoleKey)
  : supabase;
