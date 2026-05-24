-- Employer payroll settings.
-- Persists payroll defaults, rubrics, and accounting export mapping per company.

create table if not exists public.employer_payroll_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employer_payroll_settings_company_fk'
  ) then
    alter table public.employer_payroll_settings
      add constraint employer_payroll_settings_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on delete cascade;
  end if;
end $$;

alter table public.employer_payroll_settings enable row level security;

drop policy if exists employer_payroll_settings_own_rows on public.employer_payroll_settings;
create policy employer_payroll_settings_own_rows
  on public.employer_payroll_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_employer_payroll_settings_set_updated_at on public.employer_payroll_settings;
create trigger trg_employer_payroll_settings_set_updated_at
before update on public.employer_payroll_settings
for each row execute function public.set_updated_at();
