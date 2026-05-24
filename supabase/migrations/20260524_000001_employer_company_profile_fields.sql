-- Additional employer company profile fields used by payslips, contracts, and workspace UX.

alter table public.employer_companies
  add column if not exists legal_form text,
  add column if not exists address text,
  add column if not exists tax_identifier text,
  add column if not exists rc_number text,
  add column if not exists contact_email text,
  add column if not exists bank_rib text,
  add column if not exists signatory_name text,
  add column if not exists signatory_role text;
