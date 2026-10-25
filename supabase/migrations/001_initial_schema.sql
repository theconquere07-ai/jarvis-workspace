-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (auto-created from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  description text,
  status text not null default 'planned' check (status in ('planned','active','in_development','paused','completed','archived')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  category text,
  tags text[] not null default '{}',
  start_date date,
  target_date date,
  notes text,
  repo_url text,
  live_url text,
  docs_url text,
  frontend_host text,
  backend_host text,
  database_info text,
  custom_fields jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_status_idx on public.projects(status);

-- Notes (board cards)
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'note' check (type in ('note','img','doc')),
  content text,
  x integer not null default 0,
  y integer not null default 0,
  w integer not null default 260,
  h integer,
  z_index integer not null default 1,
  file_url text,
  file_name text,
  file_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_id_idx on public.notes(user_id);

-- Analyzer topics
create table if not exists public.analyzer_topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists analyzer_topics_user_id_idx on public.analyzer_topics(user_id);

-- Analyzer sections
create table if not exists public.analyzer_sections (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.analyzer_topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  section_key text not null,
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analyzer_sections_topic_section_unique unique (topic_id, section_key)
);
create index if not exists analyzer_sections_topic_id_idx on public.analyzer_sections(topic_id);

-- Work sessions
create table if not exists public.work_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_name text not null default 'Untitled work',
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms bigint,
  created_at timestamptz not null default now()
);
create index if not exists work_sessions_user_id_idx on public.work_sessions(user_id);
create index if not exists work_sessions_started_at_idx on public.work_sessions(started_at);

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger handle_updated_at_profiles before update on public.profiles for each row execute function public.handle_updated_at();
create or replace trigger handle_updated_at_projects before update on public.projects for each row execute function public.handle_updated_at();
create or replace trigger handle_updated_at_notes before update on public.notes for each row execute function public.handle_updated_at();
create or replace trigger handle_updated_at_topics before update on public.analyzer_topics for each row execute function public.handle_updated_at();
create or replace trigger handle_updated_at_sections before update on public.analyzer_sections for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.notes enable row level security;
alter table public.analyzer_topics enable row level security;
alter table public.analyzer_sections enable row level security;
alter table public.work_sessions enable row level security;

-- RLS policies
create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage own notes" on public.notes for all using (auth.uid() = user_id);
create policy "Users can manage own analyzer_topics" on public.analyzer_topics for all using (auth.uid() = user_id);
create policy "Users can manage own analyzer_sections" on public.analyzer_sections for all using (auth.uid() = user_id);
create policy "Users can manage own work_sessions" on public.work_sessions for all using (auth.uid() = user_id);
