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
