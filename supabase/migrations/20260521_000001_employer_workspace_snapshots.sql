create extension if not exists "pgcrypto";

create table if not exists public.user_employer_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_key text not null default 'default',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workspace_key)
);

create index if not exists idx_user_employer_workspaces_user_updated
  on public.user_employer_workspaces (user_id, updated_at desc);

alter table public.user_employer_workspaces enable row level security;

drop policy if exists user_employer_workspaces_own_rows on public.user_employer_workspaces;
create policy user_employer_workspaces_own_rows
  on public.user_employer_workspaces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_user_employer_workspaces_set_updated_at on public.user_employer_workspaces;
create trigger trg_user_employer_workspaces_set_updated_at
before update on public.user_employer_workspaces
for each row execute function public.set_updated_at();
