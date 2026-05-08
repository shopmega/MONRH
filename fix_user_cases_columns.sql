-- ============================================================================
-- Fix user_cases table - Add missing columns
-- Execute in Supabase SQL Editor: https://app.supabase.com/project/bxxrycsmmxnsenunvzyq/sql
-- ============================================================================

-- Add missing columns to user_cases table
alter table public.user_cases 
  add column if not exists company_id text,
  add column if not exists company_name text,
  add column if not exists source_simulation_id uuid,
  add column if not exists timeline_payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Add index for company_id if it doesn't exist
create index if not exists idx_user_cases_company
  on public.user_cases (company_id, created_at desc);

-- Verify the columns were added
comment on column public.user_cases.company_id is 'Company identifier for case context';
comment on column public.user_cases.company_name is 'Company name for display';
comment on column public.user_cases.source_simulation_id is 'Reference to originating simulation';
comment on column public.user_cases.timeline_payload is 'Case timeline and metadata';

-- ============================================================================
-- Verification query
-- ============================================================================
-- Run this to verify columns exist:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'user_cases'
-- ORDER BY ordinal_position;
