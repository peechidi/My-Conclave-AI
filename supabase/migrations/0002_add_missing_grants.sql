-- Makes projects' table-level privileges explicit instead of relying on
-- Supabase's default role grants — the ambiguity here is what made the
-- earlier "couldn't create project" bug hard to pin down. Additive only;
-- does not touch anything 0001 already created.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.projects to authenticated;
