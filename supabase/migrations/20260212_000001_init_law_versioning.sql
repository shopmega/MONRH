create extension if not exists "pgcrypto";

create table if not exists public.law_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  effective_from date not null,
  effective_to date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.tax_brackets (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  min_amount numeric(12, 2) not null,
  max_amount numeric(12, 2),
  rate numeric(5, 4) not null,
  fixed_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  check (max_amount is null or max_amount >= min_amount)
);

create table if not exists public.cnss_rates (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  employee_rate numeric(5, 4) not null,
  employer_rate numeric(5, 4) not null,
  ceiling_amount numeric(12, 2) not null,
  amo_employee_rate numeric(5, 4) not null,
  amo_employer_rate numeric(5, 4) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.indemnity_rules (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  tranche_1_years integer not null,
  tranche_1_rate_hours numeric(8, 2) not null,
  tranche_2_rate_hours numeric(8, 2) not null,
  tranche_3_rate_hours numeric(8, 2) not null,
  tranche_4_rate_hours numeric(8, 2) not null,
  notice_days_per_year integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_rules (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  accrual_days_per_month numeric(6, 3) not null,
  seniority_bonus_days numeric(6, 3) not null default 0,
  max_carryover_days numeric(8, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.smig_history (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  smig_hourly numeric(12, 2) not null,
  smag_daily numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.overtime_rules (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.law_versions(id) on delete cascade,
  day_rate numeric(5, 4) not null,
  night_rate numeric(5, 4) not null,
  weekend_rate numeric(5, 4) not null,
  holiday_rate numeric(5, 4) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  calculator_type text not null,
  executed_at timestamptz not null default now(),
  input_payload jsonb not null,
  rule_snapshot jsonb not null,
  version_id uuid not null references public.law_versions(id),
  result_payload jsonb not null
);

create index if not exists idx_law_versions_active_dates
  on public.law_versions (is_active, effective_from, effective_to);

create index if not exists idx_simulations_user_executed
  on public.simulations (user_id, executed_at desc);

insert into public.law_versions (code, label, effective_from, effective_to, is_active)
values
  ('ma_2025', 'Morocco Labor Rules 2025', date '2025-01-01', date '2025-12-31', false),
  ('ma_2026', 'Morocco Labor Rules 2026', date '2026-01-01', null, true)
on conflict (code) do nothing;
