import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
  );
}

// supabase-js resolves `auth/v1`, `rest/v1`, etc. relative to this URL, so any
// extra path left on VITE_SUPABASE_URL (e.g. a pasted "…/auth/v1") doubles up
// into requests like `/auth/v1/auth/v1/signup`, which Supabase's gateway
// rejects as an invalid path. Normalize to the origin to make that harmless.
let supabaseUrl: string;
try {
  supabaseUrl = new URL(rawSupabaseUrl).origin;
} catch {
  throw new Error(`Invalid VITE_SUPABASE_URL: "${rawSupabaseUrl}" is not a valid URL.`);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
