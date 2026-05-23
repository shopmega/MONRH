-- SIMPAIE / MONRH employer module Supabase install script.
-- Run this in Supabase SQL Editor after your base auth schema exists.
-- The script is idempotent: it uses if not exists / guarded DO blocks where possible.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as '
begin
  new.updated_at = now();
  return new;
end;
';

-- Server-owned employer subscription authority.
-- Stripe/webhook integration should upsert this table; employer company payloads must not unlock gated features.

create table if not exists public.employer_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plan in ('free', 'pro', 'cabinet')),
  check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete'))
);

create unique index if not exists idx_employer_subscriptions_stripe_customer
  on public.employer_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_employer_subscriptions_stripe_subscription
  on public.employer_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.employer_subscriptions enable row level security;

drop policy if exists employer_subscriptions_select_own on public.employer_subscriptions;
create policy employer_subscriptions_select_own
  on public.employer_subscriptions
  for select
  using (auth.uid() = user_id);

drop trigger if exists trg_employer_subscriptions_set_updated_at on public.employer_subscriptions;
create trigger trg_employer_subscriptions_set_updated_at
before update on public.employer_subscriptions
for each row execute function public.set_updated_at();

-- Legacy browser workspace snapshot backup.

create table if not exists public.user_employer_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- Employer companies and employee register.

create table if not exists public.employer_companies (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  ice text not null,
  cnss_affiliate_number text not null,
  city text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (plan in ('free', 'pro', 'cabinet'))
);

create table if not exists public.employer_employees (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  employee_number text not null default '',
  full_name text not null,
  cin text not null default '',
  role text not null,
  contract_type text not null,
  start_date date not null,
  end_date date,
  gross_salary numeric(12, 2) not null default 0,
  cnss_number text not null,
  children_count integer not null default 0,
  email text,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'Actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (contract_type in ('CDI', 'CDD', 'Stage', 'Interim')),
  check (status in ('Actif', 'Suspendu', 'Sorti')),
  check (gross_salary >= 0),
  check (children_count between 0 and 6)
);

alter table public.employer_employees
  add column if not exists employee_number text not null default '',
  add column if not exists cin text not null default '',
  add column if not exists children_count integer not null default 0;

alter table public.employer_employees
  drop constraint if exists employer_employees_children_count_range;

alter table public.employer_employees
  add constraint employer_employees_children_count_range
  check (children_count between 0 and 6);

create index if not exists idx_employer_employees_user_company
  on public.employer_employees (user_id, company_id);

alter table public.employer_companies enable row level security;
alter table public.employer_employees enable row level security;

drop policy if exists employer_companies_own_rows on public.employer_companies;
create policy employer_companies_own_rows
  on public.employer_companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_employees_own_rows on public.employer_employees;
create policy employer_employees_own_rows
  on public.employer_employees
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_companies_set_updated_at on public.employer_companies;
create trigger trg_employer_companies_set_updated_at
before update on public.employer_companies
for each row execute function public.set_updated_at();

drop trigger if exists trg_employer_employees_set_updated_at on public.employer_employees;
create trigger trg_employer_employees_set_updated_at
before update on public.employer_employees
for each row execute function public.set_updated_at();

-- Payroll runs.

create table if not exists public.employer_payroll_runs (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  period text not null,
  run_created_at timestamptz not null,
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id)
);

create index if not exists idx_employer_payroll_runs_user_company_created
  on public.employer_payroll_runs (user_id, company_id, run_created_at desc);

alter table public.employer_payroll_runs enable row level security;

drop policy if exists employer_payroll_runs_own_rows on public.employer_payroll_runs;
create policy employer_payroll_runs_own_rows
  on public.employer_payroll_runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_payroll_runs_set_updated_at on public.employer_payroll_runs;
create trigger trg_employer_payroll_runs_set_updated_at
before update on public.employer_payroll_runs
for each row execute function public.set_updated_at();

-- Leave requests and time entries.

create table if not exists public.employer_leave_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  employee_id text not null,
  employee_name text not null,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  days numeric(8, 2) not null,
  status text not null default 'pending',
  reason text not null,
  request_created_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (leave_type in ('paid', 'sick', 'unpaid', 'exceptional')),
  check (status in ('pending', 'approved', 'rejected')),
  check (days > 0)
);

create table if not exists public.employer_time_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  employee_id text not null,
  employee_name text not null,
  week_start date not null,
  regular_hours numeric(8, 2) not null default 0,
  overtime_day_hours numeric(8, 2) not null default 0,
  overtime_night_hours numeric(8, 2) not null default 0,
  overtime_rest_or_holiday_day_hours numeric(8, 2) not null default 0,
  overtime_rest_or_holiday_night_hours numeric(8, 2) not null default 0,
  overtime_amount numeric(12, 2) not null default 0,
  status text not null default 'draft',
  note text not null,
  entry_created_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (status in ('draft', 'approved', 'rejected')),
  check (regular_hours >= 0),
  check (overtime_day_hours >= 0),
  check (overtime_night_hours >= 0),
  check (overtime_rest_or_holiday_day_hours >= 0),
  check (overtime_rest_or_holiday_night_hours >= 0),
  check (overtime_amount >= 0)
);

create index if not exists idx_employer_leave_requests_user_company_created
  on public.employer_leave_requests (user_id, company_id, request_created_at desc);

create index if not exists idx_employer_time_entries_user_company_week
  on public.employer_time_entries (user_id, company_id, week_start desc);

alter table public.employer_leave_requests enable row level security;
alter table public.employer_time_entries enable row level security;

drop policy if exists employer_leave_requests_own_rows on public.employer_leave_requests;
create policy employer_leave_requests_own_rows
  on public.employer_leave_requests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_time_entries_own_rows on public.employer_time_entries;
create policy employer_time_entries_own_rows
  on public.employer_time_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_leave_requests_set_updated_at on public.employer_leave_requests;
create trigger trg_employer_leave_requests_set_updated_at
before update on public.employer_leave_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_employer_time_entries_set_updated_at on public.employer_time_entries;
create trigger trg_employer_time_entries_set_updated_at
before update on public.employer_time_entries
for each row execute function public.set_updated_at();

-- CNSS export packages.

create table if not exists public.employer_cnss_exports (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  payroll_run_id text,
  period text not null,
  filename text not null,
  status text not null default 'prepared',
  export_created_at timestamptz not null,
  rows jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (status in ('prepared', 'downloaded'))
);

create index if not exists idx_employer_cnss_exports_user_company_created
  on public.employer_cnss_exports (user_id, company_id, export_created_at desc);

alter table public.employer_cnss_exports enable row level security;

drop policy if exists employer_cnss_exports_own_rows on public.employer_cnss_exports;
create policy employer_cnss_exports_own_rows
  on public.employer_cnss_exports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_cnss_exports_set_updated_at on public.employer_cnss_exports;
create trigger trg_employer_cnss_exports_set_updated_at
before update on public.employer_cnss_exports
for each row execute function public.set_updated_at();

-- Contract archive.

create table if not exists public.employer_contract_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  id text not null,
  generated_contract_id text,
  employee_id text,
  employee_name text not null,
  contract_type text not null,
  contract_date date not null,
  status text not null default 'generated',
  filename text not null,
  content text not null,
  contract_data jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  record_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (contract_type in ('CDI', 'CDD', 'INTERIM', 'STAGE')),
  check (status in ('generated', 'downloaded'))
);

create index if not exists idx_employer_contract_records_user_company_created
  on public.employer_contract_records (user_id, company_id, record_created_at desc);

alter table public.employer_contract_records enable row level security;

drop policy if exists employer_contract_records_own_rows on public.employer_contract_records;
create policy employer_contract_records_own_rows
  on public.employer_contract_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_contract_records_set_updated_at on public.employer_contract_records;
create trigger trg_employer_contract_records_set_updated_at
before update on public.employer_contract_records
for each row execute function public.set_updated_at();

-- Reasoned compliance alert dismissals.

create table if not exists public.employer_compliance_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  alert_id text not null,
  reason text not null,
  dismissed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, alert_id)
);

create index if not exists idx_employer_compliance_dismissals_user_company
  on public.employer_compliance_dismissals (user_id, company_id, dismissed_at desc);

alter table public.employer_compliance_dismissals enable row level security;

drop policy if exists employer_compliance_dismissals_own_rows on public.employer_compliance_dismissals;
create policy employer_compliance_dismissals_own_rows
  on public.employer_compliance_dismissals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_compliance_dismissals_set_updated_at on public.employer_compliance_dismissals;
create trigger trg_employer_compliance_dismissals_set_updated_at
before update on public.employer_compliance_dismissals
for each row execute function public.set_updated_at();

-- Company ownership boundaries for child records.

alter table public.employer_employees
  drop constraint if exists employer_employees_company_fk;
alter table public.employer_employees
  add constraint employer_employees_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_payroll_runs
  drop constraint if exists employer_payroll_runs_company_fk;
alter table public.employer_payroll_runs
  add constraint employer_payroll_runs_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_leave_requests
  drop constraint if exists employer_leave_requests_company_fk;
alter table public.employer_leave_requests
  add constraint employer_leave_requests_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_time_entries
  drop constraint if exists employer_time_entries_company_fk;
alter table public.employer_time_entries
  add constraint employer_time_entries_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_cnss_exports
  drop constraint if exists employer_cnss_exports_company_fk;
alter table public.employer_cnss_exports
  add constraint employer_cnss_exports_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_contract_records
  drop constraint if exists employer_contract_records_company_fk;
alter table public.employer_contract_records
  add constraint employer_contract_records_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_compliance_dismissals
  drop constraint if exists employer_compliance_dismissals_company_fk;
alter table public.employer_compliance_dismissals
  add constraint employer_compliance_dismissals_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;
