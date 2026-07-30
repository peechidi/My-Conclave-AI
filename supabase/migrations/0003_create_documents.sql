-- Documents: files uploaded into a project, stored in the "documents" bucket
-- at {user_id}/{project_id}/{storage filename}.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  filename text not null check (char_length(trim(filename)) > 0),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  upload_status text not null default 'ready' check (upload_status in ('uploading', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_project_id_idx on public.documents (project_id);
create index documents_user_id_idx on public.documents (user_id);

alter table public.documents enable row level security;

create policy "select own documents" on public.documents
  for select using (auth.uid() = user_id);

-- Proves project_id actually belongs to the caller, not just that they set
-- user_id = themselves — the real "documents belong to your own projects" check.
create policy "insert own documents" on public.documents
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "update own documents" on public.documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own documents" on public.documents
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.documents to authenticated;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at(); -- function created in 0001

-- Storage bucket + policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;

-- Path convention: {user_id}/{project_id}/{filename} — the folder itself is
-- the access-control boundary, independent of the documents table's RLS.
create policy "Users upload to their own folder" on storage.objects
  for insert with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read their own folder" on storage.objects
  for select using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own folder" on storage.objects
  for delete using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
