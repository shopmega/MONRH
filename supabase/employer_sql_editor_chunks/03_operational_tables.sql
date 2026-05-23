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
