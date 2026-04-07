-- Contract Generator Tables
-- Template-driven, rule-based contract generation system

-- 1. Contract templates (different from document templates)
create table if not exists public.contract_templates (
  id text primary key,
  title text not null,
  description text not null,
  contract_type text not null, -- CDI, CDD, etc.
  sections jsonb not null default '[]'::jsonb, -- Template sections structure
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contract_type in ('CDI', 'CDD', 'INTERIM', 'STAGE'))
);

-- 2. Clause library
create table if not exists public.contract_clauses (
  id text primary key,
  title text not null,
  content text not null,
  category text not null, -- confidentiality, non_competition, etc.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Contract validation rules
create table if not exists public.contract_validation_rules (
  id text primary key,
  contract_type text not null,
  rule_type text not null, -- required, warning, default
  field_path text not null, -- e.g., "salary_brut", "employee.name"
  condition_expression text, -- SQL-like condition
  value_expression text, -- For default values
  error_message text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  priority INTEGER DEFAULT 0,
  logic_config JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_contract_validation_rules_priority 
ON public.contract_validation_rules(priority DESC);

COMMENT ON COLUMN public.contract_validation_rules.logic_config IS 
'JSONB field for advanced logic configuration. Supports:
- cross_field_dependencies: Array of field dependencies
- smart_defaults: Configuration for dynamic default value calculation
- visibility_rules: Conditions for showing/hiding fields';

-- 4. Generated contracts storage
CREATE TABLE IF NOT EXISTS public.generated_contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id text NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    contract_data jsonb NOT NULL,
    rendered_content text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_contracts_template_id ON public.generated_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_created_at ON public.generated_contracts(created_at);

-- RLS
alter table public.contract_templates enable row level security;
alter table public.contract_clauses enable row level security;
alter table public.contract_validation_rules enable row level security;
ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

-- Public read policies
drop policy if exists contract_templates_select_public on public.contract_templates;
create policy contract_templates_select_public
  on public.contract_templates
  for select
  using (is_active = true);

drop policy if exists contract_clauses_select_public on public.contract_clauses;
create policy contract_clauses_select_public
  on public.contract_clauses
  for select
  using (is_active = true);

drop policy if exists contract_validation_rules_select_public on public.contract_validation_rules;
create policy contract_validation_rules_select_public
  on public.contract_validation_rules
  for select
  using (is_active = true);

-- Generated contracts are private (only insert for users)
drop policy if exists generated_contracts_insert_user on public.generated_contracts;
create policy generated_contracts_insert_user
  on public.generated_contracts for insert with check (auth.uid() is not null);

drop policy if exists generated_contracts_select_user on public.generated_contracts;
create policy generated_contracts_select_user
  on public.generated_contracts
  for select
  using (auth.uid() = user_id);

-- No direct mutation policies for templates, clauses, rules (admin only)
drop policy if exists contract_validation_rules_admin_insert ON public.contract_validation_rules;
CREATE POLICY contract_validation_rules_admin_insert
  ON public.contract_validation_rules
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

drop policy if exists contract_validation_rules_admin_update ON public.contract_validation_rules;
CREATE POLICY contract_validation_rules_admin_update
  ON public.contract_validation_rules
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

drop policy if exists contract_validation_rules_admin_delete ON public.contract_validation_rules;
CREATE POLICY contract_validation_rules_admin_delete
  ON public.contract_validation_rules
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

drop trigger if exists trg_contract_templates_set_updated_at on public.contract_templates;
create trigger trg_contract_templates_set_updated_at
before update on public.contract_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_contract_clauses_set_updated_at on public.contract_clauses;
create trigger trg_contract_clauses_set_updated_at
before update on public.contract_clauses
for each row execute function public.set_updated_at();
