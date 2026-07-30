// Hand-authored to mirror supabase/migrations/0001_create_projects.sql.
// Regenerate with `supabase gen types typescript` once this project is linked
// via the Supabase CLI, and this file becomes redundant.

export type ProjectStatus = "draft" | "in-council" | "review" | "published";

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
    };
  };
};
