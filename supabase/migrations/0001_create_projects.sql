-- Projects: one row per workspace, owned by the creating user.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  audience text not null default 'General audience',
  output_type text not null default 'Long-form article',
  status text not null default 'draft' check (status in ('draft', 'in-council', 'review', 'published')),
  progress smallint not null default 0 check (progress between 0 and 100),
  trust_score smallint check (trust_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "select own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "update own projects" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Keep updated_at current on every edit (drives the "Updated Nm ago" UI).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
