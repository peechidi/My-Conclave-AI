import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

function logSupabaseError(op: string, error: PostgrestError) {
  console.error(`[projects] ${op} error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

// Verifies against Supabase's Auth server (not the local session cache) so
// that a stale/missing token surfaces here as an explicit error, not as a
// silently-undefined user_id on the insert payload below.
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  console.log("[projects] auth.getUser() user:", data.user);
  console.log("[projects] auth.getUser() user.id:", data.user?.id);

  if (error) {
    console.error("[projects] auth.getUser() error:", {
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

export async function listProjects(): Promise<Project[]> {
  const userId = await requireUserId();
  console.log("[projects] list query: user_id =", userId);

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    logSupabaseError("list", error);
    throw error;
  }
  console.log("[projects] list result:", data);
  return data;
}

export async function getProject(id: string): Promise<Project | null> {
  const userId = await requireUserId();
  console.log("[projects] get query:", { id, user_id: userId });

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logSupabaseError("get", error);
    throw error;
  }
  console.log("[projects] get result:", data);
  return data;
}

export async function createProject(title: string): Promise<Project> {
  const userId = await requireUserId();
  const payload = { title, user_id: userId };
  console.log("[projects] insert payload:", payload);

  const { data, error } = await supabase.from("projects").insert(payload).select().single();

  if (error) {
    logSupabaseError("insert", error);
    throw error;
  }
  console.log("[projects] insert result:", data);
  return data;
}

export async function renameProject(id: string, title: string): Promise<Project> {
  console.log("[projects] update payload:", { id, title });

  const { data, error } = await supabase
    .from("projects")
    .update({ title })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logSupabaseError("update", error);
    throw error;
  }
  console.log("[projects] update result:", data);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  console.log("[projects] delete payload:", { id });

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    logSupabaseError("delete", error);
    throw error;
  }
  console.log("[projects] delete result: ok");
}
