-- Employer portal core records.
-- These tables make companies and employee registers user-owned while the UI
-- continues to support local/offline storage as a fallback.

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
  full_name text not null,
  role text not null,
  contract_type text not null,
  start_date date not null,
  end_date date,
  gross_salary numeric(12, 2) not null default 0,
  cnss_number text not null,
  email text,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'Actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id, id),
  check (contract_type in ('CDI', 'CDD', 'Stage', 'Interim')),
  check (status in ('Actif', 'Suspendu', 'Sorti')),
  check (gross_salary >= 0)
);

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
