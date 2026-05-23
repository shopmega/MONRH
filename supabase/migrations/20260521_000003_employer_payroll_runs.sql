-- Employer payroll runs.
-- Stores calculated monthly payroll results per authenticated user/company.

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
