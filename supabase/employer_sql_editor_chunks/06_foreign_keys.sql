alter table public.employer_employees
  drop constraint if exists employer_employees_company_fk;
alter table public.employer_employees
  add constraint employer_employees_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_payroll_runs
  drop constraint if exists employer_payroll_runs_company_fk;
alter table public.employer_payroll_runs
  add constraint employer_payroll_runs_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_leave_requests
  drop constraint if exists employer_leave_requests_company_fk;
alter table public.employer_leave_requests
  add constraint employer_leave_requests_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_time_entries
  drop constraint if exists employer_time_entries_company_fk;
alter table public.employer_time_entries
  add constraint employer_time_entries_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_cnss_exports
  drop constraint if exists employer_cnss_exports_company_fk;
alter table public.employer_cnss_exports
  add constraint employer_cnss_exports_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_contract_records
  drop constraint if exists employer_contract_records_company_fk;
alter table public.employer_contract_records
  add constraint employer_contract_records_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;

alter table public.employer_compliance_dismissals
  drop constraint if exists employer_compliance_dismissals_company_fk;
alter table public.employer_compliance_dismissals
  add constraint employer_compliance_dismissals_company_fk
  foreign key (user_id, company_id)
  references public.employer_companies (user_id, id)
  on update cascade
  on delete cascade
  not valid;
