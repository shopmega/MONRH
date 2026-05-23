-- Employee payroll identity fields required by payslips and CNSS exports.

alter table public.employer_employees
  add column if not exists employee_number text not null default '',
  add column if not exists cin text not null default '',
  add column if not exists children_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_employees_children_count_range'
  ) then
    alter table public.employer_employees
      add constraint employer_employees_children_count_range
      check (children_count between 0 and 6);
  end if;
end;
$$;
