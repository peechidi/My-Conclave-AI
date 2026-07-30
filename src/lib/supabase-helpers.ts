import { supabase } from "@/lib/supabase";

// Shape covers both Postgrest errors (code/details/hint) and Storage errors
// (name/status) without depending on either package's error class directly.
type SupabaseErrorLike = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
  status?: number;
};

// Verifies against Supabase's Auth server (not the local session cache) so
// that a stale/missing token surfaces here as an explicit error, not as a
// silently-undefined user_id further down the call chain.
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  console.log("[supabase] auth.getUser() user:", data.user);
  console.log("[supabase] auth.getUser() user.id:", data.user?.id);

  if (error) {
    console.error("[supabase] auth.getUser() error:", {
      name: error.name,
      status: error.status,
      message: error.message,
    });
    throw new Error(`Not signed in (auth.getUser failed: ${error.message}).`);
  }

  if (!data.user?.id) {
    throw new Error("Not signed in: auth.getUser() returned no user.");
  }

  return data.user.id;
}

// Always logs the full technical error, then throws a friendly one — callers
// never see raw Supabase internals, but nothing is ever silently swallowed.
export function handleSupabaseError(
  op: string,
  error: SupabaseErrorLike,
  friendlyMessage: string,
): never {
  console.error(`[supabase] ${op} error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    name: error.name,
    status: error.status,
  });
  throw new Error(friendlyMessage);
}
