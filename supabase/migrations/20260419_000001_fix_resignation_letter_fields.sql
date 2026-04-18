update public.document_templates
set
  fields = '[
    {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Sara El Amrani"},
    {"id":"company_name","label":"Nom de l''entreprise","placeholder":"Ex: Atlas Services"},
    {"id":"position","label":"Poste","placeholder":"Ex: Chargee de paie"},
    {"id":"effective_date","label":"Date de depart","placeholder":"YYYY-MM-DD","type":"date"}
  ]'::jsonb,
  updated_at = now()
where id = 'resignation-letter';

update public.document_templates
set
  fields = '[
    {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Youssef Benali"},
    {"id":"company_name","label":"Nom de l''entreprise","placeholder":"Ex: Maghreb Tech"},
    {"id":"period","label":"Periode concernee","placeholder":"Ex: Janvier 2026"},
    {"id":"amount_due","label":"Montant reclame (MAD)","placeholder":"Ex: 7500"}
  ]'::jsonb,
  updated_at = now()
where id = 'salary-recovery-letter';
