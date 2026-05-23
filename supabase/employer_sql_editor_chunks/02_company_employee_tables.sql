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
  add column if not exists employee_number text not null default '';

alter table public.employer_employees
  add column if not exists cin text not null default '';

alter table public.employer_employees
  add column if not exists children_count integer not null default 0;

alter table public.employer_employees
  drop constraint if exists employer_employees_children_count_range;

alter table public.employer_employees
  add constraint employer_employees_children_count_range
  check (children_count between 0 and 6);

create index if not exists idx_employer_employees_user_company
  on public.employer_employees (user_id, company_id);
