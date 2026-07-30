// Hand-authored to mirror supabase/migrations/0001_create_projects.sql.
// Regenerate with `supabase gen types typescript` once this project is linked
// via the Supabase CLI, and this file becomes redundant.

export type ProjectStatus = "draft" | "in-council" | "review" | "published";
export type DocumentStatus = "uploading" | "ready" | "failed";
export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          audience: string;
          output_type: string;
          status: ProjectStatus;
          progress: number;
          trust_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          audience?: string;
          output_type?: string;
          status?: ProjectStatus;
          progress?: number;
          trust_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          audience?: string;
          output_type?: string;
          status?: ProjectStatus;
          progress?: number;
          trust_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          filename: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          upload_status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string;
          filename: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          upload_status?: DocumentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          filename?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          upload_status?: DocumentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_contents: {
        Row: {
          id: string;
          document_id: string;
          project_id: string;
          user_id: string;
          raw_text: string | null;
          page_count: number | null;
          word_count: number | null;
          language: string | null;
          processing_status: ProcessingStatus;
          processing_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          project_id: string;
          user_id?: string;
          raw_text?: string | null;
          page_count?: number | null;
          word_count?: number | null;
          language?: string | null;
          processing_status?: ProcessingStatus;
          processing_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          project_id?: string;
          user_id?: string;
          raw_text?: string | null;
          page_count?: number | null;
          word_count?: number | null;
          language?: string | null;
          processing_status?: ProcessingStatus;
          processing_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
