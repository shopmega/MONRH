-- Reasoned compliance alert dismissals per authenticated user/company.

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

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employer_compliance_dismissals_company_fk'
  ) then
    alter table public.employer_compliance_dismissals
      add constraint employer_compliance_dismissals_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;
end;
$$;

drop trigger if exists trg_employer_compliance_dismissals_set_updated_at on public.employer_compliance_dismissals;
create trigger trg_employer_compliance_dismissals_set_updated_at
before update on public.employer_compliance_dismissals
for each row execute function public.set_updated_at();
