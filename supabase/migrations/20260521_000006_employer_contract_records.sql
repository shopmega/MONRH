-- Employer contract archive.
-- Keeps generated contracts tied to the authenticated user and active company.

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
