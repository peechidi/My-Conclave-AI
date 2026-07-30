-- AI Council: one session per document, one response per agent per session,
-- one summary per session.
create table public.council_sessions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.council_agent_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.council_sessions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  agent_key text not null check (agent_key in (
    'medical_reviewer', 'content_strategist', 'audience_specialist',
    'public_health_advisor', 'creative_storytelling_editor'
  )),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  confidence_score smallint check (confidence_score between 0 and 100),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, agent_key)
);

create table public.council_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.council_sessions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  consensus text,
  conflicts jsonb not null default '[]'::jsonb,
  recommended_improvements jsonb not null default '[]'::jsonb,
  overall_confidence smallint check (overall_confidence between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index council_sessions_document_id_idx on public.council_sessions (document_id);
create index council_sessions_project_id_idx on public.council_sessions (project_id);
create index council_sessions_user_id_idx on public.council_sessions (user_id);
create index council_agent_responses_session_id_idx on public.council_agent_responses (session_id);
create index council_agent_responses_user_id_idx on public.council_agent_responses (user_id);
create index council_summaries_project_id_idx on public.council_summaries (project_id);

alter table public.council_sessions enable row level security;
alter table public.council_agent_responses enable row level security;
alter table public.council_summaries enable row level security;

-- sessions: ownership check on insert mirrors documents' "own project" pattern from 0003
create policy "select own council sessions" on public.council_sessions for select using (auth.uid() = user_id);
create policy "insert own council sessions" on public.council_sessions for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
);
create policy "update own council sessions" on public.council_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own council sessions" on public.council_sessions for delete using (auth.uid() = user_id);

create policy "select own agent responses" on public.council_agent_responses for select using (auth.uid() = user_id);
create policy "insert own agent responses" on public.council_agent_responses for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.council_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "update own agent responses" on public.council_agent_responses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own agent responses" on public.council_agent_responses for delete using (auth.uid() = user_id);

create policy "select own council summaries" on public.council_summaries for select using (auth.uid() = user_id);
create policy "insert own council summaries" on public.council_summaries for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.council_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "update own council summaries" on public.council_summaries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own council summaries" on public.council_summaries for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.council_sessions to authenticated;
grant select, insert, update, delete on public.council_agent_responses to authenticated;
grant select, insert, update, delete on public.council_summaries to authenticated;

create trigger council_sessions_set_updated_at before update on public.council_sessions for each row execute function public.set_updated_at();
create trigger council_agent_responses_set_updated_at before update on public.council_agent_responses for each row execute function public.set_updated_at();
create trigger council_summaries_set_updated_at before update on public.council_summaries for each row execute function public.set_updated_at();
