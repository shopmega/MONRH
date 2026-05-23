alter table public.employer_subscriptions enable row level security;
alter table public.user_employer_workspaces enable row level security;
alter table public.employer_companies enable row level security;
alter table public.employer_employees enable row level security;
alter table public.employer_payroll_runs enable row level security;
alter table public.employer_leave_requests enable row level security;
alter table public.employer_time_entries enable row level security;
alter table public.employer_cnss_exports enable row level security;
alter table public.employer_contract_records enable row level security;
alter table public.employer_compliance_dismissals enable row level security;

drop policy if exists employer_subscriptions_select_own on public.employer_subscriptions;
create policy employer_subscriptions_select_own
  on public.employer_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists user_employer_workspaces_own_rows on public.user_employer_workspaces;
create policy user_employer_workspaces_own_rows
  on public.user_employer_workspaces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

drop policy if exists employer_payroll_runs_own_rows on public.employer_payroll_runs;
create policy employer_payroll_runs_own_rows
  on public.employer_payroll_runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_leave_requests_own_rows on public.employer_leave_requests;
create policy employer_leave_requests_own_rows
  on public.employer_leave_requests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_time_entries_own_rows on public.employer_time_entries;
create policy employer_time_entries_own_rows
  on public.employer_time_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_cnss_exports_own_rows on public.employer_cnss_exports;
create policy employer_cnss_exports_own_rows
  on public.employer_cnss_exports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_contract_records_own_rows on public.employer_contract_records;
create policy employer_contract_records_own_rows
  on public.employer_contract_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employer_compliance_dismissals_own_rows on public.employer_compliance_dismissals;
create policy employer_compliance_dismissals_own_rows
  on public.employer_compliance_dismissals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
