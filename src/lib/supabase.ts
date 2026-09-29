import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in environment variables.");
}

// Fallback dummy values during static compilation (next build) to prevent module load crashes
const targetUrl = supabaseUrl || "https://placeholder.supabase.co";
const targetAnonKey = supabaseAnonKey || "placeholder";

// Client for standard operations (RLS enforced if user token provided)
export const supabase = createClient(targetUrl, targetAnonKey);

const isValidServiceKey =
  supabaseServiceRoleKey &&
  !supabaseServiceRoleKey.includes("your_") &&
  supabaseServiceRoleKey.trim().length > 20;

// Admin client for backend operations that bypass RLS when valid service role key is configured
export const supabaseAdmin = isValidServiceKey
  ? createClient(targetUrl, supabaseServiceRoleKey)
  : supabase;


