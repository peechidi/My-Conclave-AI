import { supabase } from "@/lib/supabase";
import { handleSupabaseError, requireUserId } from "@/lib/supabase-helpers";
import type { Database } from "@/lib/database.types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export async function listProjects(): Promise<Project[]> {
  const userId = await requireUserId();
  console.log("[projects] list query: user_id =", userId);

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) handleSupabaseError("list", error, "Couldn't load your projects.");
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

  if (error) handleSupabaseError("get", error, "Couldn't load the project.");
  console.log("[projects] get result:", data);
  return data;
}

export async function createProject(title: string): Promise<Project> {
  const userId = await requireUserId();
  const payload = { title, user_id: userId };
  console.log("[projects] insert payload:", payload);

  const { data, error } = await supabase.from("projects").insert(payload).select().single();

  if (error) handleSupabaseError("insert", error, "Couldn't create the project.");
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

  if (error) handleSupabaseError("update", error, "Couldn't rename the project.");
  console.log("[projects] update result:", data);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  console.log("[projects] delete payload:", { id });

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) handleSupabaseError("delete", error, "Couldn't delete the project.");
  console.log("[projects] delete result: ok");
}
