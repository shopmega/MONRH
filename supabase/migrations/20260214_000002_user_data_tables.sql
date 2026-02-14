create extension if not exists "pgcrypto";

create table if not exists public.user_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  calculator_type text not null,
  input_payload jsonb not null,
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_id text not null,
  template_title text not null,
  values_payload jsonb not null,
  preview_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_violation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  description text not null,
  occurred_at text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_overtime_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  work_date text not null,
  hours_day numeric(8, 2) not null default 0,
  hours_night numeric(8, 2) not null default 0,
  hours_weekend numeric(8, 2) not null default 0,
  hours_holiday numeric(8, 2) not null default 0,
  proof_url text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_simulations_user_created
  on public.user_simulations (user_id, created_at desc);
create index if not exists idx_user_documents_user_created
  on public.user_documents (user_id, created_at desc);
create index if not exists idx_user_violation_logs_user_created
  on public.user_violation_logs (user_id, created_at desc);
create index if not exists idx_user_overtime_logs_user_created
  on public.user_overtime_logs (user_id, created_at desc);

alter table public.user_simulations enable row level security;
alter table public.user_documents enable row level security;
alter table public.user_violation_logs enable row level security;
alter table public.user_overtime_logs enable row level security;

drop policy if exists user_simulations_own_rows on public.user_simulations;
create policy user_simulations_own_rows
  on public.user_simulations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_documents_own_rows on public.user_documents;
create policy user_documents_own_rows
  on public.user_documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_violation_logs_own_rows on public.user_violation_logs;
create policy user_violation_logs_own_rows
  on public.user_violation_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_overtime_logs_own_rows on public.user_overtime_logs;
create policy user_overtime_logs_own_rows
  on public.user_overtime_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

