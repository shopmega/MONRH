-- ============================================================================
-- MONRH Missing Tables SQL
-- For shared Supabase database with Avisine
-- Execute in Supabase SQL Editor: https://app.supabase.com/project/bxxrycsmmxnsenunvzyq/sql
-- ============================================================================

-- 1. Create user_violation_logs table
create table if not exists public.user_violation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  description text not null,
  occurred_at text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_violation_logs_user_created
  on public.user_violation_logs (user_id, created_at desc);

alter table public.user_violation_logs enable row level security;

drop policy if exists user_violation_logs_own_rows on public.user_violation_logs;
create policy user_violation_logs_own_rows
  on public.user_violation_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Create evidence_artifacts table
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

create index if not exists idx_evidence_artifacts_user_created
  on public.evidence_artifacts (user_id, created_at desc);

create index if not exists idx_evidence_artifacts_company
  on public.evidence_artifacts (company_id, created_at desc);

alter table public.evidence_artifacts enable row level security;

drop policy if exists evidence_artifacts_own_rows on public.evidence_artifacts;
create policy evidence_artifacts_own_rows
  on public.evidence_artifacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.evidence_artifacts is 'User-owned evidence metadata for generated documents, uploads, and later verification flows.';

-- 3. Create employment_verifications table
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

create index if not exists idx_employment_verifications_user_created
  on public.employment_verifications (user_id, created_at desc);

create index if not exists idx_employment_verifications_company
  on public.employment_verifications (company_id, created_at desc);

create index if not exists idx_employment_verifications_status
  on public.employment_verifications (status, created_at desc);

alter table public.employment_verifications enable row level security;

drop policy if exists employment_verifications_own_rows on public.employment_verifications;
create policy employment_verifications_own_rows
  on public.employment_verifications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.employment_verifications is 'Pending or reviewed employment relationship verification records linked to company, document, and evidence metadata.';

-- ============================================================================
-- Verification: Check that tables were created
-- ============================================================================
-- Run this query to verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('user_violation_logs', 'evidence_artifacts', 'employment_verifications')
-- ORDER BY table_name;
