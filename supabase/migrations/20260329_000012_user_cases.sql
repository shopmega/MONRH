create table if not exists public.user_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  case_type text not null,
  title text not null,
  status text not null default 'open',
  company_id text,
  company_name text,
  source_simulation_id uuid,
  timeline_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_cases_user_created
  on public.user_cases (user_id, created_at desc);

alter table public.user_cases enable row level security;

drop policy if exists user_cases_own_rows on public.user_cases;
create policy user_cases_own_rows
  on public.user_cases
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
