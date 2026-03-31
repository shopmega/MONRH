-- Store company names entered by users when no Reviewly match was selected.
-- Use these to add new businesses to the Avis/Reviewly API (e.g. admin job or API integration).

create table if not exists public.suggested_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_id uuid,
  template_id text not null,
  field_id text not null,
  company_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_suggested_companies_created
  on public.suggested_companies (created_at desc);
create index if not exists idx_suggested_companies_template
  on public.suggested_companies (template_id);

alter table public.suggested_companies enable row level security;

-- Only backend (service role) inserts; no user-facing read. Admin can query via service role.
drop policy if exists suggested_companies_service_only on public.suggested_companies;
create policy suggested_companies_service_only
  on public.suggested_companies
  for all
  using (false)
  with check (false);

comment on table public.suggested_companies is 'Company names from document generator when user did not select a Reviewly match; for adding to Avis API.';
