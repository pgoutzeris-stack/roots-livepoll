-- ROOTS Live Poll – Supabase Schema (public.lp_*)
-- Ausführen im Supabase SQL Editor oder via CLI Migration

create extension if not exists pgcrypto;

create table if not exists public.lp_presentations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Unbenannte Präsentation',
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  folder text,
  is_favorite boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lp_slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.lp_presentations(id) on delete cascade,
  sort_order int not null default 0,
  slide_type text not null,
  content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lp_sessions (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.lp_presentations(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  status text not null default 'live' check (status in ('live', 'paused', 'ended')),
  mode text not null default 'live' check (mode in ('live', 'self_paced', 'survey')),
  current_slide_index int not null default 0,
  question_open boolean not null default false,
  join_locked boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.lp_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lp_sessions(id) on delete cascade,
  device_id text not null,
  display_name text,
  avatar_emoji text,
  avatar_color text default '#206efb',
  joined_at timestamptz not null default now(),
  unique (session_id, device_id)
);

create table if not exists public.lp_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lp_sessions(id) on delete cascade,
  slide_id uuid not null references public.lp_slides(id) on delete cascade,
  participant_id uuid references public.lp_participants(id) on delete set null,
  response jsonb not null default '{}'::jsonb,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lp_presentation_versions (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.lp_presentations(id) on delete cascade,
  label text,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists lp_presentations_owner_idx on public.lp_presentations(owner_id, updated_at desc);
create index if not exists lp_slides_presentation_idx on public.lp_slides(presentation_id, sort_order);
create index if not exists lp_sessions_code_idx on public.lp_sessions(code);
create index if not exists lp_sessions_presentation_idx on public.lp_sessions(presentation_id, started_at desc);
create index if not exists lp_responses_session_slide_idx on public.lp_responses(session_id, slide_id, created_at);

create or replace function public.lp_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lp_presentations_touch on public.lp_presentations;
create trigger lp_presentations_touch before update on public.lp_presentations
for each row execute function public.lp_touch_updated_at();

drop trigger if exists lp_slides_touch on public.lp_slides;
create trigger lp_slides_touch before update on public.lp_slides
for each row execute function public.lp_touch_updated_at();

create or replace function public.lp_is_presentation_owner(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lp_presentations p
    where p.id = p_id and p.owner_id = auth.uid()
  );
$$;

create or replace function public.lp_session_is_joinable(s_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lp_sessions s
    where s.id = s_id and s.status in ('live', 'paused') and s.join_locked = false
  );
$$;

alter table public.lp_presentations enable row level security;
alter table public.lp_slides enable row level security;
alter table public.lp_sessions enable row level security;
alter table public.lp_participants enable row level security;
alter table public.lp_responses enable row level security;
alter table public.lp_presentation_versions enable row level security;

-- Presentations (owner only)
drop policy if exists lp_presentations_select on public.lp_presentations;
create policy lp_presentations_select on public.lp_presentations for select
  using (owner_id = auth.uid());
drop policy if exists lp_presentations_insert on public.lp_presentations;
create policy lp_presentations_insert on public.lp_presentations for insert
  with check (owner_id = auth.uid());
drop policy if exists lp_presentations_update on public.lp_presentations;
create policy lp_presentations_update on public.lp_presentations for update
  using (owner_id = auth.uid());
drop policy if exists lp_presentations_delete on public.lp_presentations;
create policy lp_presentations_delete on public.lp_presentations for delete
  using (owner_id = auth.uid());

-- Slides (via presentation owner)
drop policy if exists lp_slides_select on public.lp_slides;
create policy lp_slides_select on public.lp_slides for select
  using (
    public.lp_is_presentation_owner(presentation_id)
    or exists (
      select 1 from public.lp_sessions s
      where s.presentation_id = lp_slides.presentation_id
        and s.status in ('live', 'paused', 'ended')
    )
  );
drop policy if exists lp_slides_all on public.lp_slides;
create policy lp_slides_insert on public.lp_slides for insert
  with check (public.lp_is_presentation_owner(presentation_id));
create policy lp_slides_update on public.lp_slides for update
  using (public.lp_is_presentation_owner(presentation_id));
create policy lp_slides_delete on public.lp_slides for delete
  using (public.lp_is_presentation_owner(presentation_id));

-- Sessions: host manages; anon can read live sessions (join by code)
drop policy if exists lp_sessions_host on public.lp_sessions;
create policy lp_sessions_host_select on public.lp_sessions for select
  using (host_id = auth.uid() or status in ('live', 'paused'));
create policy lp_sessions_host_insert on public.lp_sessions for insert
  with check (host_id = auth.uid());
create policy lp_sessions_host_update on public.lp_sessions for update
  using (host_id = auth.uid());
create policy lp_sessions_host_delete on public.lp_sessions for delete
  using (host_id = auth.uid());

-- Participants: anyone can join live session; host can read all for own sessions
drop policy if exists lp_participants_select on public.lp_participants;
create policy lp_participants_select on public.lp_participants for select
  using (
    exists (select 1 from public.lp_sessions s where s.id = session_id and (s.host_id = auth.uid() or s.status in ('live', 'paused')))
  );
drop policy if exists lp_participants_insert on public.lp_participants;
create policy lp_participants_insert on public.lp_participants for insert
  with check (public.lp_session_is_joinable(session_id));

-- Responses
drop policy if exists lp_responses_select on public.lp_responses;
create policy lp_responses_select on public.lp_responses for select
  using (
    exists (
      select 1 from public.lp_sessions s
      where s.id = session_id and (s.host_id = auth.uid() or s.status in ('live', 'paused', 'ended'))
    )
  );
drop policy if exists lp_responses_insert on public.lp_responses;
create policy lp_responses_insert on public.lp_responses for insert
  with check (public.lp_session_is_joinable(session_id));

drop policy if exists lp_responses_update on public.lp_responses;
create policy lp_responses_update on public.lp_responses for update
  using (
    exists (select 1 from public.lp_sessions s where s.id = session_id and s.host_id = auth.uid())
  );

-- Versions
drop policy if exists lp_versions_all on public.lp_presentation_versions;
create policy lp_versions_select on public.lp_presentation_versions for select
  using (public.lp_is_presentation_owner(presentation_id));
create policy lp_versions_insert on public.lp_presentation_versions for insert
  with check (public.lp_is_presentation_owner(presentation_id));
create policy lp_versions_delete on public.lp_presentation_versions for delete
  using (public.lp_is_presentation_owner(presentation_id));

drop policy if exists lp_participants_update on public.lp_participants;
create policy lp_participants_update on public.lp_participants
  for update using (public.lp_session_is_joinable(session_id))
  with check (public.lp_session_is_joinable(session_id));

drop policy if exists lp_responses_update_live on public.lp_responses;
create policy lp_responses_update_live on public.lp_responses
  for update using (
    exists (select 1 from public.lp_sessions s where s.id = session_id and s.status in ('live', 'paused'))
  )
  with check (
    exists (select 1 from public.lp_sessions s where s.id = session_id and s.status in ('live', 'paused'))
  );

drop policy if exists lp_responses_delete on public.lp_responses;
create policy lp_responses_delete on public.lp_responses
  for delete using (
    exists (select 1 from public.lp_sessions s where s.id = session_id and s.host_id = auth.uid())
  );
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lp_sessions'
  ) then
    alter publication supabase_realtime add table public.lp_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lp_responses'
  ) then
    alter publication supabase_realtime add table public.lp_responses;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lp_participants'
  ) then
    alter publication supabase_realtime add table public.lp_participants;
  end if;
end $$;
