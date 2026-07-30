import { supabase } from "@/lib/supabase";
import { handleSupabaseError, requireUserId } from "@/lib/supabase-helpers";
import { getDocument } from "@/lib/document-service";
import type { Database, ProcessingStatus } from "@/lib/database.types";

export type DocumentContent = Database["public"]["Tables"]["document_contents"]["Row"];

const LANGUAGE_NAMES: Record<string, string> = {
  eng: "English",
  spa: "Spanish",
  fra: "French",
  deu: "German",
  por: "Portuguese",
  ita: "Italian",
  nld: "Dutch",
  rus: "Russian",
  cmn: "Chinese",
  jpn: "Japanese",
  kor: "Korean",
  ara: "Arabic",
  hin: "Hindi",
};

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

async function extractPdfText(blob: Blob): Promise<{ text: string; pageCount: number | null }> {
  const [pdfjsLib, workerUrl] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url").then((m) => m.default),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await blob.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }

  return { text, pageCount: doc.numPages };
}

async function extractDocxText(blob: Blob): Promise<{ text: string; pageCount: number | null }> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await blob.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  // DOCX has no fixed page count without full layout/pagination — honestly unavailable.
  return { text: value, pageCount: null };
}

export async function extractText(
  blob: Blob,
  filename: string,
): Promise<{ text: string; pageCount: number | null }> {
  const ext = getExtension(filename);
  switch (ext) {
    case ".pdf":
      return extractPdfText(blob);
    case ".docx":
      return extractDocxText(blob);
    case ".txt":
    case ".md":
      return { text: await blob.text(), pageCount: null };
    default:
      throw new Error(`Unsupported file type for processing: ${ext || "unknown"}`);
  }
}

// Collapses repeated spaces/tabs and excess blank lines without touching line
// breaks themselves — that's what keeps heading lines and paragraph structure intact.
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export async function detectLanguage(text: string): Promise<string | null> {
  if (text.trim().length < 10) return null;
  const { franc } = await import("franc-min");
  const code = franc(text);
  if (code === "und") return null;
  return LANGUAGE_NAMES[code] ?? code;
}

type SaveProcessedDocumentInput = {
  documentId: string;
  projectId: string;
  status: ProcessingStatus;
  rawText?: string;
  pageCount?: number | null;
  wordCount?: number;
  language?: string | null;
  processingError?: string;
};

export async function saveProcessedDocument(
  input: SaveProcessedDocumentInput,
): Promise<DocumentContent> {
  const userId = await requireUserId();
  const payload = {
    document_id: input.documentId,
    project_id: input.projectId,
    user_id: userId,
    processing_status: input.status,
    ...(input.rawText !== undefined && { raw_text: input.rawText }),
    ...(input.pageCount !== undefined && { page_count: input.pageCount }),
    ...(input.wordCount !== undefined && { word_count: input.wordCount }),
    ...(input.language !== undefined && { language: input.language }),
    ...(input.processingError !== undefined && { processing_error: input.processingError }),
  };
  console.log("[document-contents] upsert payload:", payload);

  const { data, error } = await supabase
    .from("document_contents")
    .upsert(payload, { onConflict: "document_id" })
    .select()
    .single();

  if (error) handleSupabaseError("upsert", error, "Couldn't save processing results.");
  console.log("[document-contents] upsert result:", data);
  return data;
}

export async function getProcessedDocument(documentId: string): Promise<DocumentContent | null> {
  const { data, error } = await supabase
    .from("document_contents")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) handleSupabaseError("get", error, "Couldn't load processing results.");
  return data;
}

// Orchestrates the full pipeline for one document. Never throws — any
// failure is captured and stored as processing_status: "failed" so the UI
// can show it instead of the app crashing.
export async function processDocument(documentId: string): Promise<void> {
  const document = await getDocument(documentId);
  if (!document) {
    console.error("[document-contents] processDocument: document not found", { documentId });
    return;
  }

  try {
    await saveProcessedDocument({
      documentId,
      projectId: document.project_id,
      status: "processing",
    });

    const { data: blob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.storage_path);
    if (downloadError) {
      handleSupabaseError("storage download", downloadError, "Couldn't download the document.");
    }

    const { text: rawExtracted, pageCount } = await extractText(blob, document.filename);
    const text = normalizeText(rawExtracted);
    const wordCount = countWords(text);
    const language = await detectLanguage(text);

    await saveProcessedDocument({
      documentId,
      projectId: document.project_id,
      status: "ready",
      rawText: text,
      pageCount,
      wordCount,
      language,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    console.error("[document-contents] processing failed:", { documentId, error: message });
    await saveProcessedDocument({
      documentId,
      projectId: document.project_id,
      status: "failed",
      processingError: message,
    });
  }
}
