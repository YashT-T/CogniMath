-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- One row per finished sprint or round. Each signed-in user can only see and add their own rows.

create table if not exists public.sprints (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section     text not null default 'everyone',   -- everyone | autism
  topic       text not null,
  mode        text,
  score       int  not null default 0,
  ghost       int  not null default 0,
  n           int  not null check (n >= 0),        -- questions answered
  ok          int  not null check (ok >= 0),       -- answered correctly
  tags        jsonb not null default '{}'::jsonb,  -- { skill: { n, m } }
  created_at  timestamptz not null default now()
);

create index if not exists sprints_user_section_idx on public.sprints (user_id, section, created_at desc);

alter table public.sprints enable row level security;

create policy "read own sprints"   on public.sprints for select to authenticated using (user_id = auth.uid());
create policy "insert own sprints" on public.sprints for insert to authenticated with check (user_id = auth.uid());
create policy "delete own sprints" on public.sprints for delete to authenticated using (user_id = auth.uid());
