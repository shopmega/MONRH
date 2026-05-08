-- Contract Generator: Advanced Validation & Logic Schema Update
-- Adds support for complex expressions, priority, and conditional sections
-- PREREQUISITE: Run 20260331_000008_contract_generator.sql first

-- Check if base table exists before attempting modifications
DO $$
BEGIN
    -- Only proceed if contract_validation_rules table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_validation_rules') THEN
        
        -- Add priority and logic_config to validation rules
        ALTER TABLE public.contract_validation_rules 
        ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS logic_config JSONB DEFAULT '{}'::jsonb;

        -- Create index on priority for faster rule evaluation
        CREATE INDEX IF NOT EXISTS idx_contract_validation_rules_priority 
        ON public.contract_validation_rules(priority DESC);

        -- Add comment to document the new logic_config structure
        COMMENT ON COLUMN public.contract_validation_rules.logic_config IS 
        'JSONB field for advanced logic configuration. Supports:
        - cross_field_dependencies: Array of field dependencies
        - smart_defaults: Configuration for dynamic default value calculation
        - visibility_rules: Conditions for showing/hiding fields';

        -- Update RLS policies to ensure admin-only write access
        DROP POLICY IF EXISTS contract_validation_rules_admin_insert ON public.contract_validation_rules;
        CREATE POLICY contract_validation_rules_admin_insert
          ON public.contract_validation_rules
          FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'admin');

        DROP POLICY IF EXISTS contract_validation_rules_admin_update ON public.contract_validation_rules;
        CREATE POLICY contract_validation_rules_admin_update
          ON public.contract_validation_rules
          FOR UPDATE
          USING (auth.jwt() ->> 'role' = 'admin');

        DROP POLICY IF EXISTS contract_validation_rules_admin_delete ON public.contract_validation_rules;
        CREATE POLICY contract_validation_rules_admin_delete
          ON public.contract_validation_rules
          FOR DELETE
          USING (auth.jwt() ->> 'role' = 'admin');

        RAISE NOTICE 'Advanced validation logic schema updated successfully';
    ELSE
        RAISE NOTICE 'Skipping advanced validation logic: Base table contract_validation_rules does not exist. Please run 20260331_000008_contract_generator.sql first.';
    END IF;
END $$;
