-- Seed data for Contract Generator
-- Template-driven, rule-based system

-- Contract Templates
INSERT INTO public.contract_templates (id, title, description, contract_type, sections, is_active)
VALUES
  (
    'CDI',
    'Contrat de Travail à Durée Indéterminée (CDI)',
    'Modèle de contrat CDI conforme au Code du travail marocain',
    'CDI',
    '[
      {
        "id": "header",
        "title": "Entête",
        "order": 1,
        "content": "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE\nEntre les soussignés:"
      },
      {
        "id": "parties",
        "title": "Parties",
        "order": 2,
        "content": "L''employeur: {{company_name}}\n{{company_address}}\n{{company_rc}}\n{{company_cnss}}\n\nLe salarié: {{employee_name}}\n{{employee_address}}\n{{employee_cin}}\n{{employee_cnss}}"
      },
      {
        "id": "job",
        "title": "Poste et Fonctions",
        "order": 3,
        "content": "Le salarié est engagé en qualité de {{job_title}}\n\nFonctions principales:\n{{job_description}}"
      },
      {
        "id": "duration",
        "title": "Durée du Contrat",
        "order": 4,
        "content": "Le contrat est à durée indéterminée et prend effet à compter du {{start_date}}."
      },
      {
        "id": "trial_period",
        "title": "Période d''Essai",
        "order": 5,
        "content": "Une période d''essai de {{trial_period_duration}} est prévue conformément à l''article 14 du Code du travail."
      },
      {
        "id": "salary",
        "title": "Rémunération",
        "order": 6,
        "content": "Le salarié percevra un salaire mensuel brut de {{salary_brut}} MAD, payable {{payment_frequency}}.\n\nSalaire net estimé: {{salary_net}} MAD\n\nMode de paiement: {{payment_method}}"
      },
      {
        "id": "work_time",
        "title": "Temps de Travail",
        "order": 7,
        "content": "Le temps de travail est fixé à {{work_hours}} heures par semaine, réparties sur {{work_days}} jours.\n\nHoraires: {{work_schedule}}"
      },
      {
        "id": "leave",
        "title": "Congés",
        "order": 8,
        "content": "Le salarié bénéficie des congés légaux:\n- Congés annuels: {{annual_leave_days}} jours ouvrables\n- Congés exceptionnels selon la loi"
      },
      {
        "id": "obligations",
        "title": "Obligations des Parties",
        "order": 9,
        "content": "Obligations de l''employeur:\n- Respecter le salaire et les conditions de travail\n- Fournir le matériel nécessaire\n- Assurer la sécurité au travail\n\nObligations du salarié:\n- Exécuter les tâches avec diligence\n- Respecter les horaires et règles internes\n- Maintenir la confidentialité"
      },
      {
        "id": "clauses",
        "title": "Clauses Particulières",
        "order": 10,
        "content": "{{selected_clauses}}"
      },
      {
        "id": "termination",
        "title": "Rupture du Contrat",
        "order": 11,
        "content": "La rupture du contrat peut intervenir par:\n- Démission avec préavis de {{notice_period_employee}} jours\n- Licenciement pour motif légitime\n- Rupture amiable d''un commun accord"
      },
      {
        "id": "jurisdiction",
        "title": "Juridiction",
        "order": 12,
        "content": "Tout litige sera porté devant le tribunal compétent du lieu de travail."
      },
      {
        "id": "signature",
        "title": "Signatures",
        "order": 13,
        "content": "Fait à {{contract_location}}, le {{contract_date}}\n\nPour l''employeur:\n\nPour le salarié:"
      }
    ]'::jsonb,
    true
  ),
  (
    'CDD',
    'Contrat de Travail à Durée Déterminée (CDD)',
    'Modèle de contrat CDD conforme au Code du travail marocain',
    'CDD',
    '[
      {
        "id": "header",
        "title": "Entête",
        "order": 1,
        "content": "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE\nEntre les soussignés:"
      },
      {
        "id": "parties",
        "title": "Parties",
        "order": 2,
        "content": "L''employeur: {{company_name}}\n{{company_address}}\n{{company_rc}}\n{{company_cnss}}\n\nLe salarié: {{employee_name}}\n{{employee_address}}\n{{employee_cin}}\n{{employee_cnss}}"
      },
      {
        "id": "job",
        "title": "Poste et Fonctions",
        "order": 3,
        "content": "Le salarié est engagé en qualité de {{job_title}}\n\nFonctions principales:\n{{job_description}}"
      },
      {
        "id": "duration",
        "title": "Durée du Contrat",
        "order": 4,
        "content": "Le contrat est conclu pour une durée de {{contract_duration}} mois, du {{start_date}} au {{end_date}}."
      },
      {
        "id": "justification",
        "title": "Justification du CDD",
        "order": 5,
        "content": "Le contrat est motivé par: {{cdd_justification}} conformément à l''article 16 du Code du travail."
      },
      {
        "id": "trial_period",
        "title": "Période d''Essai",
        "order": 6,
        "content": "Une période d''essai de {{trial_period_duration}} est prévue."
      },
      {
        "id": "salary",
        "title": "Rémunération",
        "order": 7,
        "content": "Le salarié percevra un salaire mensuel brut de {{salary_brut}} MAD, payable {{payment_frequency}}."
      },
      {
        "id": "work_time",
        "title": "Temps de Travail",
        "order": 8,
        "content": "Le temps de travail est fixé à {{work_hours}} heures par semaine."
      },
      {
        "id": "renewal",
        "title": "Renouvellement",
        "order": 9,
        "content": "Le contrat peut être renouvelé {{renewal_times}} fois pour une durée maximale totale de {{max_duration}} mois."
      },
      {
        "id": "clauses",
        "title": "Clauses Particulières",
        "order": 10,
        "content": "{{selected_clauses}}"
      },
      {
        "id": "termination",
        "title": "Rupture Anticipée",
        "order": 11,
        "content": "En cas de rupture anticipée, les indemnités prévues par l''article 41 du Code du travail s''appliqueront."
      },
      {
        "id": "signature",
        "title": "Signatures",
        "order": 12,
        "content": "Fait à {{contract_location}}, le {{contract_date}}"
      }
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, description = EXCLUDED.description, sections = EXCLUDED.sections, is_active = EXCLUDED.is_active;

-- Clause Library
INSERT INTO public.contract_clauses (id, title, content, category, is_active)
VALUES
  (
    'confidentiality',
    'Clause de Confidentialité',
    'Le salarié s''engage à ne pas divulguer, pendant et après l''exécution du contrat, toute information confidentielle concernant l''entreprise, ses clients, ses procédés ou ses stratégies. Cette obligation de confidentialité persiste après la fin du contrat.',
    'confidentiality',
    true
  ),
  (
    'non_competition',
    'Clause de Non-Concurrence',
    'Pendant la durée du contrat et pour une période de {{non_competition_duration}} mois après sa fin, le salarié s''engage à ne pas exercer d''activité concurrente pour des entreprises similaires dans un rayon de {{non_competition_radius}} km. En contrepartie, l''employeur versera une indemnité de {{non_competition_compensation}} MAD.',
    'non_competition',
    true
  ),
  (
    'exclusivity',
    'Clause d''Exclusivité',
    'Le salarié s''engage à consacrer la totalité de son temps de travail professionnel à l''entreprise et à n''exercer aucune autre activité professionnelle rémunérée pendant la durée du contrat.',
    'exclusivity',
    true
  ),
  (
    'mobility',
    'Clause de Mobilité',
    'Le salarié accepte d''être amené à exercer ses fonctions sur différents sites de l''entreprise situés sur le territoire marocain. Les changements d''affectation seront notifiés avec un préavis de {{mobility_notice}} jours.',
    'mobility',
    true
  ),
  (
    'training',
    'Clause de Formation',
    'L''employeur s''engage à assurer la formation continue du salarié pour l''adaptation à l''évolution des techniques et des qualifications. Le salarié s''engage à participer activement aux actions de formation proposées.',
    'training',
    true
  ),
  (
    'intellectual_property',
    'Clause de Propriété Intellectuelle',
    'Toutes les créations, inventions ou œuvres réalisées par le salarié dans l''exercice de ses fonctions appartiennent à l''employeur. Le salarié cède à l''employeur tous les droits de propriété intellectuelle sur ces créations.',
    'intellectual_property',
    true
  ),
  (
    'probation_extension',
    'Extension Période d''Essai',
    'La période d''essai pourra être prolongée d''une durée maximale de {{probation_extension_duration}} jours en cas d''absence du salarié pour maladie ou accident.',
    'probation_extension',
    true
  ),
  (
    'remote_work',
    'Télétravail',
    'Le salarié pourra être amené à exercer ses fonctions en télétravail jusqu''à {{remote_work_days}} jours par semaine, selon les besoins de l''entreprise et avec l''accord des deux parties.',
    'remote_work',
    true
  )
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, content = EXCLUDED.content, category = EXCLUDED.category, is_active = EXCLUDED.is_active;

-- Validation Rules
INSERT INTO public.contract_validation_rules (id, contract_type, rule_type, field_path, condition_expression, value_expression, error_message, is_active)
VALUES
  -- Required fields for all contracts
  (
    'employee_name_required',
    'ALL',
    'required',
    'employee_name',
    'employee_name IS NOT NULL AND employee_name != ""',
    null,
    'Le nom du salarié est obligatoire',
    true
  ),
  (
    'company_name_required',
    'ALL',
    'required',
    'company_name',
    'company_name IS NOT NULL AND company_name != ""',
    null,
    'Le nom de l''entreprise est obligatoire',
    true
  ),
  (
    'salary_brut_required',
    'ALL',
    'required',
    'salary_brut',
    'salary_brut IS NOT NULL AND salary_brut > 0',
    null,
    'Le salaire brut est obligatoire',
    true
  ),
  (
    'job_title_required',
    'ALL',
    'required',
    'job_title',
    'job_title IS NOT NULL AND job_title != ""',
    null,
    'Le poste est obligatoire',
    true
  ),
  (
    'start_date_required',
    'ALL',
    'required',
    'start_date',
    'start_date IS NOT NULL AND start_date != ""',
    null,
    'La date de début est obligatoire',
    true
  ),
  -- CDD specific requirements
  (
    'cdd_duration_required',
    'CDD',
    'required',
    'contract_duration',
    'contract_duration IS NOT NULL AND contract_duration > 0',
    null,
    'La durée du CDD est obligatoire',
    true
  ),
  (
    'cdd_end_date_required',
    'CDD',
    'required',
    'end_date',
    'end_date IS NOT NULL AND end_date != ""',
    null,
    'La date de fin est obligatoire pour un CDD',
    true
  ),
  (
    'cdd_justification_required',
    'CDD',
    'required',
    'cdd_justification',
    'cdd_justification IS NOT NULL AND cdd_justification != ""',
    null,
    'La justification du CDD est obligatoire',
    true
  ),
  -- Warning rules
  (
    'salary_smig_warning',
    'ALL',
    'warning',
    'salary_brut',
    'salary_brut < 3000',
    null,
    'Attention: le salaire est inférieur au SMIG (3000 MAD)',
    true
  ),
  (
    'cdd_duration_warning',
    'CDD',
    'warning',
    'contract_duration',
    'contract_duration > 18',
    null,
    'Attention: la durée du CDD dépasse 18 mois (maximum légal)',
    true
  ),
  -- Default values
  (
    'payment_frequency_default',
    'ALL',
    'default',
    'payment_frequency',
    'payment_frequency IS NULL OR payment_frequency = ""',
    '"mensuel"',
    null,
    true
  ),
  (
    'work_hours_default',
    'ALL',
    'default',
    'work_hours',
    'work_hours IS NULL OR work_hours = ""',
    '"44"',
    null,
    true
  ),
  (
    'work_days_default',
    'ALL',
    'default',
    'work_days',
    'work_days IS NULL OR work_days = ""',
    '"6"',
    null,
    true
  ),
  (
    'trial_period_cadre_default',
    'ALL',
    'default',
    'trial_period_duration',
    'role_level = "cadre" AND (trial_period_duration IS NULL OR trial_period_duration = "")',
    '"3 mois"',
    null,
    true
  ),
  (
    'trial_period_employee_default',
    'ALL',
    'default',
    'trial_period_duration',
    'role_level != "cadre" AND (trial_period_duration IS NULL OR trial_period_duration = "")',
    '"1.5 mois"',
    null,
    true
  ),
  (
    'notice_period_employee_default',
    'ALL',
    'default',
    'notice_period_employee',
    'notice_period_employee IS NULL OR notice_period_employee = ""',
    '"15"',
    null,
    true
  ),
  (
    'annual_leave_days_default',
    'ALL',
    'default',
    'annual_leave_days',
    'annual_leave_days IS NULL OR annual_leave_days = ""',
    '"18"',
    null,
    true
  ),
  (
    'contract_location_default',
    'ALL',
    'default',
    'contract_location',
    'contract_location IS NULL OR contract_location = ""',
    '"Casablanca"',
    null,
    true
  ),
  (
    'contract_date_default',
    'ALL',
    'default',
    'contract_date',
    'contract_date IS NULL OR contract_date = ""',
    'CURRENT_DATE',
    null,
    true
  )
ON CONFLICT (id) DO UPDATE 
SET rule_type = EXCLUDED.rule_type, condition_expression = EXCLUDED.condition_expression, value_expression = EXCLUDED.value_expression, error_message = EXCLUDED.error_message, is_active = EXCLUDED.is_active;
