do $$
declare
  settings_key text := 'link_map';
  has_key_column boolean;
  has_name_column boolean;
  existing_value jsonb;
  next_value jsonb;
  document_links jsonb := '{
    "resignation-letter": {
      "articleSlugs": [],
      "toolIds": ["demission", "duree_preavis", "final_settlement_audit"],
      "documentIds": ["notice-letter"]
    },
    "notice-letter": {
      "articleSlugs": [],
      "toolIds": ["duree_preavis", "demission"],
      "documentIds": ["resignation-letter"]
    },
    "salary-recovery-letter": {
      "articleSlugs": [],
      "toolIds": ["unpaid_salary_recovery", "salary_delay_alert", "pre_litigation_timeline"],
      "documentIds": ["formal-complaint-employer", "labor-inspector-complaint"]
    },
    "overtime-claim-letter": {
      "articleSlugs": [],
      "toolIds": ["overtime", "unpaid_overtime_recovery", "pre_litigation_timeline"],
      "documentIds": ["formal-complaint-employer", "labor-inspector-complaint"]
    },
    "formal-complaint-employer": {
      "articleSlugs": [],
      "toolIds": ["pre_litigation_timeline", "compliance_risk_score"],
      "documentIds": ["labor-inspector-complaint"]
    },
    "labor-inspector-complaint": {
      "articleSlugs": [],
      "toolIds": ["pre_litigation_timeline", "compliance_risk_score"],
      "documentIds": ["formal-complaint-employer", "salary-recovery-letter", "overtime-claim-letter"]
    },
    "cnss-complaint-letter": {
      "articleSlugs": [],
      "toolIds": ["payslip_detector", "cnss_pension"],
      "documentIds": ["formal-complaint-employer"]
    },
    "work-accident-declaration": {
      "articleSlugs": [],
      "toolIds": ["work_accident"],
      "documentIds": ["formal-complaint-employer"]
    },
    "maternity-leave-request": {
      "articleSlugs": [],
      "toolIds": ["maternity_leave"],
      "documentIds": ["employment-certificate-request"]
    },
    "contract-renewal-request": {
      "articleSlugs": [],
      "toolIds": ["fixed_term_contract_risk", "fin_cdd"],
      "documentIds": ["employment-certificate-request"]
    },
    "mutual-termination-proposal": {
      "articleSlugs": [],
      "toolIds": ["final_settlement_audit", "duree_preavis"],
      "documentIds": ["notice-letter"]
    },
    "employment-certificate-request": {
      "articleSlugs": [],
      "toolIds": [],
      "documentIds": ["contract-renewal-request"]
    }
  }'::jsonb;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_settings'
      and column_name = 'key'
  ) into has_key_column;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_settings'
      and column_name = 'name'
  ) into has_name_column;

  if has_key_column then
    execute 'select value from public.app_settings where key = $1'
      into existing_value
      using settings_key;
  elsif has_name_column then
    execute 'select value from public.app_settings where name = $1'
      into existing_value
      using settings_key;
  else
    raise notice 'public.app_settings has neither key nor name column; skipping link_map seed';
    return;
  end if;

  next_value := jsonb_build_object(
    'article', coalesce(existing_value->'article', '{}'::jsonb),
    'simulator', coalesce(existing_value->'simulator', '{}'::jsonb),
    'document', coalesce(existing_value->'document', '{}'::jsonb) || document_links,
    'updatedAt', to_jsonb(now()::text)
  );

  if has_key_column then
    execute 'insert into public.app_settings (key, value, updated_at) values ($1, $2, now()) on conflict (key) do update set value = excluded.value, updated_at = now()'
      using settings_key, next_value;
  else
    execute 'insert into public.app_settings (name, value, updated_at) values ($1, $2, now()) on conflict (name) do update set value = excluded.value, updated_at = now()'
      using settings_key, next_value;
  end if;
end $$;
