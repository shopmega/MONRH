-- Employer CNSS export packages.
-- Stores generated monthly CNSS CSV packages per authenticated user/company.

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
