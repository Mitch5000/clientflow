-- ClientFlow backend schema for Supabase (Postgres)
-- Text primary keys preserve the app's existing id scheme (p1, t1, u1, ...).
-- Run this once in the Supabase SQL Editor.

create table if not exists public.users (
  id         text primary key,
  name       text not null default '',
  email      text not null default '',
  role       text not null default 'Team Member',
  avatar     text,
  created_at text not null default ''
);

create table if not exists public.team_members (
  id         text primary key,
  name       text not null default '',
  email      text not null default '',
  role       text not null default '',
  avatar     text not null default '',
  emoji      text,
  department text not null default '',
  status     text not null default 'active',
  joined_at  text not null default ''
);

create table if not exists public.projects (
  id          text primary key,
  name        text not null default '',
  description text not null default '',
  status      text not null default 'active',
  progress    integer not null default 0,
  start_date  text not null default '',
  end_date    text not null default '',
  budget      double precision not null default 0,
  client      text not null default '',
  color       text not null default '#4f4665',
  members     jsonb not null default '[]'::jsonb,
  created_at  text not null default ''
);

create table if not exists public.tasks (
  id          text primary key,
  title       text not null default '',
  description text not null default '',
  status      text not null default 'todo',
  priority    text not null default 'medium',
  project_id  text references public.projects(id) on delete cascade,
  assignee_id text not null default '',
  due_date    text not null default '',
  created_at  text not null default '',
  pinned      boolean not null default false,
  comments    jsonb not null default '[]'::jsonb
);

create table if not exists public.activities (
  id          text primary key,
  type        text not null default 'task',
  action      text not null default '',
  user_id     text not null default '',
  target_name text not null default '',
  timestamp   text not null default ''
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists activities_ts_idx on public.activities(timestamp desc);

-- Row Level Security: shared-workspace demo. Any signed-in user can read/write.
-- (For production you would scope rows by user_id / workspace membership.)
alter table public.users        enable row level security;
alter table public.team_members enable row level security;
alter table public.projects     enable row level security;
alter table public.tasks        enable row level security;
alter table public.activities   enable row level security;

do $$ begin
  create policy "auth_all_users"        on public.users        for all to authenticated using (true) with check (true);
  create policy "auth_all_team_members" on public.team_members for all to authenticated using (true) with check (true);
  create policy "auth_all_projects"     on public.projects     for all to authenticated using (true) with check (true);
  create policy "auth_all_tasks"        on public.tasks        for all to authenticated using (true) with check (true);
  create policy "auth_all_activities"   on public.activities   for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Realtime: makes multi-user collaboration genuinely live.
do $$ begin alter publication supabase_realtime add table public.tasks;        exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.projects;     exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.activities;   exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.team_members; exception when duplicate_object then null; end $$;
