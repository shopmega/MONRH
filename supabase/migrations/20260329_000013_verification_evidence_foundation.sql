create table if not exists public.evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  artifact_type text not null,
  status text not null default 'available',
  title text not null,
  description text,
  company_id text,
  company_name text,
  document_id uuid references public.user_documents(id) on delete set null,
  case_id uuid references public.user_cases(id) on delete set null,
  storage_bucket text,
  storage_path text,
  artifact_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_links (
  id uuid primary key default gen_random_uuid(),
  evidence_artifact_id uuid not null references public.evidence_artifacts(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  relationship text not null default 'supports',
  created_at timestamptz not null default now()
);

create table if not exists public.employment_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id text not null,
  company_name text,
  status text not null default 'pending',
  source_type text not null,
  source_document_id uuid references public.user_documents(id) on delete set null,
  source_case_id uuid references public.user_cases(id) on delete set null,
  evidence_artifact_id uuid references public.evidence_artifacts(id) on delete set null,
  verification_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_decisions (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.employment_verifications(id) on delete cascade,
  decider_user_id uuid,
  decision text not null,
  note text,
  evidence_artifact_id uuid references public.evidence_artifacts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_artifacts_user_created
  on public.evidence_artifacts (user_id, created_at desc);
create index if not exists idx_evidence_artifacts_company
  on public.evidence_artifacts (company_id, created_at desc);
create index if not exists idx_evidence_links_artifact
  on public.evidence_links (evidence_artifact_id, created_at desc);
create index if not exists idx_evidence_links_entity
  on public.evidence_links (entity_type, entity_id);
create index if not exists idx_employment_verifications_user_created
  on public.employment_verifications (user_id, created_at desc);
create index if not exists idx_employment_verifications_company
  on public.employment_verifications (company_id, created_at desc);
create index if not exists idx_employment_verifications_status
  on public.employment_verifications (status, created_at desc);
create index if not exists idx_verification_decisions_verification
  on public.verification_decisions (verification_id, created_at desc);

alter table public.evidence_artifacts enable row level security;
alter table public.evidence_links enable row level security;
alter table public.employment_verifications enable row level security;
alter table public.verification_decisions enable row level security;

drop policy if exists evidence_artifacts_own_rows on public.evidence_artifacts;
create policy evidence_artifacts_own_rows
  on public.evidence_artifacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists employment_verifications_own_rows on public.employment_verifications;
create policy employment_verifications_own_rows
  on public.employment_verifications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.evidence_artifacts is 'User-owned evidence metadata for generated documents, uploads, and later verification flows.';
comment on table public.evidence_links is 'Polymorphic links between evidence artifacts and business entities such as cases, companies, or documents.';
comment on table public.employment_verifications is 'Pending or reviewed employment relationship verification records linked to company, document, and evidence metadata.';
comment on table public.verification_decisions is 'Administrative or automated decisions taken on employment verification records.';
