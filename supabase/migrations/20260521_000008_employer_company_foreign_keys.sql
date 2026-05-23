-- Enforce company ownership boundaries for employer module child records.
-- Constraints are NOT VALID so existing local/cloud backfills are not blocked,
-- while all new writes must reference a company owned by the same user.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employer_employees_company_fk'
  ) then
    alter table public.employer_employees
      add constraint employer_employees_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_payroll_runs_company_fk'
  ) then
    alter table public.employer_payroll_runs
      add constraint employer_payroll_runs_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_leave_requests_company_fk'
  ) then
    alter table public.employer_leave_requests
      add constraint employer_leave_requests_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_time_entries_company_fk'
  ) then
    alter table public.employer_time_entries
      add constraint employer_time_entries_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_cnss_exports_company_fk'
  ) then
    alter table public.employer_cnss_exports
      add constraint employer_cnss_exports_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_contract_records_company_fk'
  ) then
    alter table public.employer_contract_records
      add constraint employer_contract_records_company_fk
      foreign key (user_id, company_id)
      references public.employer_companies (user_id, id)
      on update cascade
      on delete cascade
      not valid;
  end if;
end;
$$;
