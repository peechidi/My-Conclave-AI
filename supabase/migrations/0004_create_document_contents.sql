-- Document contents: extracted, normalized text + metadata for each document,
-- one row per document. This is the durable source future AI features read
-- from — never the original PDF/DOCX.
create table public.document_contents (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  raw_text text,
  page_count integer,
  word_count integer,
  language text,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_contents_project_id_idx on public.document_contents (project_id);
create index document_contents_user_id_idx on public.document_contents (user_id);
-- document_id's `unique` constraint above already gives it an index.

alter table public.document_contents enable row level security;

create policy "select own document contents" on public.document_contents
  for select using (auth.uid() = user_id);

create policy "insert own document contents" on public.document_contents
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );

create policy "update own document contents" on public.document_contents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own document contents" on public.document_contents
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.document_contents to authenticated;

create trigger document_contents_set_updated_at
  before update on public.document_contents
  for each row execute function public.set_updated_at(); -- function created in 0001
