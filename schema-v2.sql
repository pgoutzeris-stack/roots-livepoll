-- ROOTS Live Poll – Schema V2 Migration
-- Run AFTER schema.sql. Idempotent: kann mehrfach ausgeführt werden.

-- ═══════════════════════════════════════════════════════
-- 1) RESPONSE SIZE + SHAPE CONSTRAINTS
-- ═══════════════════════════════════════════════════════
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lp_responses_size_check') then
    alter table public.lp_responses
      add constraint lp_responses_size_check check (pg_column_size(response) < 8192);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lp_responses_shape_check') then
    alter table public.lp_responses
      add constraint lp_responses_shape_check check (
        jsonb_typeof(response) in ('object','array','string','number','boolean','null')
      );
  end if;
end $$;

-- ═══════════════════════════════════════════════════════
-- 2) PARTICIPANT HEARTBEAT + DEVICE INFO
-- ═══════════════════════════════════════════════════════
alter table public.lp_participants
  add column if not exists last_active_at timestamptz not null default now(),
  add column if not exists user_agent text,
  add column if not exists kicked boolean not null default false;

create index if not exists lp_participants_active_idx
  on public.lp_participants(session_id, last_active_at desc);

-- ═══════════════════════════════════════════════════════
-- 3) Q&A UPVOTES (für Frage-Reihenfolge)
-- ═══════════════════════════════════════════════════════
create table if not exists public.lp_qna_upvotes (
  response_id uuid not null references public.lp_responses(id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (response_id, device_id)
);

create index if not exists lp_qna_upvotes_response_idx
  on public.lp_qna_upvotes(response_id);

alter table public.lp_qna_upvotes enable row level security;

drop policy if exists lp_qna_upvotes_select on public.lp_qna_upvotes;
create policy lp_qna_upvotes_select on public.lp_qna_upvotes for select using (true);

drop policy if exists lp_qna_upvotes_insert on public.lp_qna_upvotes;
create policy lp_qna_upvotes_insert on public.lp_qna_upvotes for insert with check (true);

drop policy if exists lp_qna_upvotes_delete on public.lp_qna_upvotes;
create policy lp_qna_upvotes_delete on public.lp_qna_upvotes for delete using (true);

-- ═══════════════════════════════════════════════════════
-- 4) QUIZ LEADERBOARD MATERIALIZED VIEW (live aggregation)
-- ═══════════════════════════════════════════════════════
create or replace view public.lp_quiz_leaderboard as
select
  r.session_id,
  r.participant_id,
  p.display_name,
  p.avatar_emoji,
  p.avatar_color,
  count(*) filter (where (r.response->>'correct')::boolean) as correct_count,
  count(*) filter (where r.response ? 'correct') as answered_count,
  coalesce(sum(((r.response->>'score'))::numeric), 0) as total_score,
  max(r.created_at) as last_answer_at
from public.lp_responses r
join public.lp_participants p on p.id = r.participant_id
join public.lp_slides s on s.id = r.slide_id
where s.slide_type = 'quiz' and not r.is_hidden
group by r.session_id, r.participant_id, p.display_name, p.avatar_emoji, p.avatar_color;

grant select on public.lp_quiz_leaderboard to anon, authenticated;

-- ═══════════════════════════════════════════════════════
-- 5) PARTIAL INDEX FÜR AKTIVE SESSIONS (Performance)
-- ═══════════════════════════════════════════════════════
create index if not exists lp_sessions_active_code_idx
  on public.lp_sessions(code) where status in ('live','paused');

create index if not exists lp_responses_slide_visible_idx
  on public.lp_responses(slide_id, created_at desc) where not is_hidden;

-- ═══════════════════════════════════════════════════════
-- 6) AUTO-CLEANUP STALE SESSIONS
-- ═══════════════════════════════════════════════════════
create or replace function public.lp_cleanup_stale_sessions()
returns int language plpgsql security definer as $$
declare n int;
begin
  with closed as (
    update public.lp_sessions
       set status = 'ended', ended_at = now()
     where status in ('live','paused')
       and started_at < now() - interval '24 hours'
    returning 1
  )
  select count(*) into n from closed;
  return n;
end $$;

grant execute on function public.lp_cleanup_stale_sessions() to authenticated;

-- Optional: per pg_cron alle Stunde laufen lassen
-- Voraussetzung: Extension pg_cron aktiviert (Dashboard → Database → Extensions)
-- select cron.schedule('lp-cleanup-stale', '0 * * * *', $$select public.lp_cleanup_stale_sessions()$$);

-- ═══════════════════════════════════════════════════════
-- 7) SESSION MAX-LIMITS (Anti-Abuse)
-- ═══════════════════════════════════════════════════════
create or replace function public.lp_check_session_limits()
returns trigger language plpgsql as $$
declare n int;
begin
  -- Max 500 Teilnehmer pro Session
  select count(*) into n from public.lp_participants where session_id = new.session_id and not kicked;
  if n >= 500 then
    raise exception 'Session participant limit (500) reached';
  end if;
  return new;
end $$;

drop trigger if exists lp_participants_limit on public.lp_participants;
create trigger lp_participants_limit
  before insert on public.lp_participants
  for each row execute function public.lp_check_session_limits();

create or replace function public.lp_check_response_limits()
returns trigger language plpgsql as $$
declare n int;
begin
  if new.participant_id is not null then
    -- Max 50 Antworten pro Teilnehmer pro Slide (verhindert Spam)
    select count(*) into n from public.lp_responses
      where session_id = new.session_id
        and slide_id = new.slide_id
        and participant_id = new.participant_id;
    if n >= 50 then
      raise exception 'Response limit per slide reached';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists lp_responses_limit on public.lp_responses;
create trigger lp_responses_limit
  before insert on public.lp_responses
  for each row execute function public.lp_check_response_limits();

-- ═══════════════════════════════════════════════════════
-- 8) PROFANITY MODERATION QUEUE FLAG
-- ═══════════════════════════════════════════════════════
alter table public.lp_responses
  add column if not exists needs_moderation boolean not null default false,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

create index if not exists lp_responses_needs_mod_idx
  on public.lp_responses(session_id, needs_moderation) where needs_moderation = true;

-- ═══════════════════════════════════════════════════════
-- 9) SLIDE SETTINGS DEFAULTS (Timer, Auto-Advance, etc.)
-- ═══════════════════════════════════════════════════════
-- Keine Schema-Änderung nötig — alles in settings jsonb.
-- Frontend-Konvention dokumentiert in app.js:
--   settings.timer.seconds      number | null
--   settings.timer.autoClose    boolean
--   settings.autoAdvance        number | null    // bei X% Antworten weiter
--   settings.anonymous          boolean
--   settings.moderate           boolean          // Q&A/Open Antworten erst nach Approval
--   settings.showLeaderboard    boolean          // bei Quiz: Live-Top-N anzeigen

-- ═══════════════════════════════════════════════════════
-- 10) AUDIT LOG (Optional, hilft beim Debugging)
-- ═══════════════════════════════════════════════════════
create table if not exists public.lp_audit (
  id bigserial primary key,
  session_id uuid references public.lp_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists lp_audit_session_idx on public.lp_audit(session_id, created_at desc);

alter table public.lp_audit enable row level security;
drop policy if exists lp_audit_select on public.lp_audit;
create policy lp_audit_select on public.lp_audit for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.lp_sessions s where s.id = lp_audit.session_id and s.host_id = auth.uid())
  );
drop policy if exists lp_audit_insert on public.lp_audit;
create policy lp_audit_insert on public.lp_audit for insert
  with check (
    user_id = auth.uid() or user_id is null
  );

-- ═══════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════
-- Verify:
--   select * from pg_constraint where conname like 'lp_%';
--   select * from pg_indexes where tablename like 'lp_%';

-- ═══════════════════════════════════════════════════════
-- SECURITY HARDENING (2026-06) — applied via Supabase migration
--   "security_hardening_safe_subset". Idempotent; safe subset only
--   (verified against client write patterns — the client never performs
--   the operations being locked down). Anonymous-participant write
--   scoping (own-row only) still requires anonymous auth — see README.
-- ═══════════════════════════════════════════════════════

-- Anon could DELETE any Q&A upvote (was using=true). Client only inserts; cascade handles cleanup.
drop policy if exists lp_qna_upvotes_delete on public.lp_qna_upvotes;

-- Audit insert allowed anon rows (user_id IS NULL). Client never writes audit; require authenticated author.
drop policy if exists lp_audit_insert on public.lp_audit;
create policy lp_audit_insert on public.lp_audit
  for insert to public
  with check (user_id = auth.uid());

-- Slides (incl. quiz answer keys) were anon-readable forever once any session hit 'ended'.
-- Limit anon reads to active sessions; host still reads as presentation owner.
drop policy if exists lp_slides_select on public.lp_slides;
create policy lp_slides_select on public.lp_slides
  for select to public
  using (
    public.lp_is_presentation_owner(presentation_id)
    or exists (
      select 1 from public.lp_sessions s
      where s.presentation_id = lp_slides.presentation_id
        and s.status = any (array['live'::text, 'paused'::text])
    )
  );

-- Responses likewise stayed anon-readable after 'ended'. Host still reads via host_id.
drop policy if exists lp_responses_select on public.lp_responses;
create policy lp_responses_select on public.lp_responses
  for select to public
  using (
    exists (
      select 1 from public.lp_sessions s
      where s.id = lp_responses.session_id
        and (s.host_id = auth.uid() or s.status = any (array['live'::text, 'paused'::text]))
    )
  );
