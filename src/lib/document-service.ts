import { supabase } from "@/lib/supabase";
import { handleSupabaseError, requireUserId } from "@/lib/supabase-helpers";
import type { Database } from "@/lib/database.types";

export type DocumentRecord = Database["public"]["Tables"]["documents"]["Row"];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB, matches the bucket's file_size_limit
const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
};
const ALLOWED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION);

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export type FileValidation = { valid: true } | { valid: false; message: string };

export function validateDocumentFile(file: File): FileValidation {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      message: `Unsupported file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, message: "This file is empty." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: "File is larger than 20 MB." };
  }
  return { valid: true };
}

export async function uploadDocument(projectId: string, file: File): Promise<DocumentRecord> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) throw new Error(validation.message);

  const userId = await requireUserId();
  const mimeType =
    file.type || MIME_BY_EXTENSION[getExtension(file.name)] || "application/octet-stream";
  const storagePath = `${userId}/${projectId}/${crypto.randomUUID()}-${file.name}`;

  console.log("[documents] storage upload:", { storagePath, mimeType, size: file.size });

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: mimeType });

  if (uploadError) {
    handleSupabaseError("storage upload", uploadError, "Couldn't upload the document.");
  }

  const payload = {
    project_id: projectId,
    user_id: userId,
    filename: file.name,
    storage_path: storagePath,
    mime_type: mimeType,
    file_size: file.size,
    upload_status: "ready" as const,
  };
  console.log("[documents] insert payload:", payload);

  const { data, error } = await supabase.from("documents").insert(payload).select().single();

  if (error) {
    // Storage upload already succeeded — don't leave an orphaned file behind.
    await supabase.storage.from("documents").remove([storagePath]);
    handleSupabaseError("insert", error, "Couldn't save the document. Please try again.");
  }

  console.log("[documents] insert result:", data);
  return data;
}

export async function listDocuments(projectId: string): Promise<DocumentRecord[]> {
  const userId = await requireUserId();
  console.log("[documents] list query:", { project_id: projectId, user_id: userId });

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError("list", error, "Couldn't load documents.");
  console.log("[documents] list result:", data);
  return data;
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const userId = await requireUserId();
  console.log("[documents] get query:", { id, user_id: userId });

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) handleSupabaseError("get", error, "Couldn't load the document.");
  console.log("[documents] get result:", data);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const document = await getDocument(id);
  if (!document) throw new Error("Document not found.");

  console.log("[documents] delete:", { id, storage_path: document.storage_path });

  const { error: removeError } = await supabase.storage
    .from("documents")
    .remove([document.storage_path]);
  if (removeError) {
    handleSupabaseError("storage remove", removeError, "Couldn't delete the file.");
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) handleSupabaseError("delete", error, "Couldn't delete the document.");

  console.log("[documents] delete result: ok");
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600);
  if (error) handleSupabaseError("signed url", error, "Couldn't generate a download link.");
  console.log("[documents] signed url ok for:", storagePath);
  return data.signedUrl;
}
