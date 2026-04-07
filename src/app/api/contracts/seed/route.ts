import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Insert contract templates
    const { error: templatesError } = await supabase
      .from("contract_templates")
      .upsert([
        {
          id: 'CDI',
          title: 'Contrat de Travail à Durée Indéterminée (CDI)',
          description: 'Modèle de contrat CDI conforme au Code du travail marocain',
          contract_type: 'CDI',
          sections: [
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
              "content": "L'employeur: {{company_name}}\n{{company_address}}\n{{company_rc}}\n{{company_cnss}}\n\nLe salarié: {{employee_name}}\n{{employee_address}}\n{{employee_cin}}\n{{employee_cnss}}"
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
              "title": "Période d'Essai",
              "order": 5,
              "content": "Une période d'essai de {{trial_period_duration}} est prévue conformément à l'article 14 du Code du travail."
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
              "content": "Obligations de l'employeur:\n- Respecter le salaire et les conditions de travail\n- Fournir le matériel nécessaire\n- Assurer la sécurité au travail\n\nObligations du salarié:\n- Exécuter les tâches avec diligence\n- Respecter les horaires et règles internes\n- Maintenir la confidentialité"
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
              "content": "La rupture du contrat peut intervenir par:\n- Démission avec préavis de {{notice_period_employee}} jours\n- Licenciement pour motif légitime\n- Rupture amiable d'un commun accord"
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
              "content": "Fait à {{contract_location}}, le {{contract_date}}\n\nPour l'employeur:\n\nPour le salarié:"
            }
          ],
          is_active: true
        },
        {
          id: 'CDD',
          title: 'Contrat de Travail à Durée Déterminée (CDD)',
          description: 'Modèle de contrat CDD conforme au Code du travail marocain',
          contract_type: 'CDD',
          sections: [
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
              "content": "L'employeur: {{company_name}}\n{{company_address}}\n{{company_rc}}\n{{company_cnss}}\n\nLe salarié: {{employee_name}}\n{{employee_address}}\n{{employee_cin}}\n{{employee_cnss}}"
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
              "content": "Le contrat est motivé par: {{cdd_justification}} conformément à l'article 16 du Code du travail."
            },
            {
              "id": "trial_period",
              "title": "Période d'Essai",
              "order": 6,
              "content": "Une période d'essai de {{trial_period_duration}} est prévue."
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
              "content": "Le présent contrat pourra être renouvelé {{renewal_times}} fois sans pour autant que sa durée totale excède {{max_duration}} mois, conformément à la législation en vigueur."
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
              "content": "En cas de rupture anticipée du contrat par l'une des parties en dehors de la période d'essai ou faute grave, les indemnités prévues par l'article 41 du Code du travail marocain seront applicables."
            },
            {
              "id": "signature",
              "title": "Signatures",
              "order": 12,
              "content": "Fait à {{contract_location}}, le {{contract_date}}\n\nPour l'employeur:\n\nPour le salarié:"
            }
          ],
          is_active: true
        }
      ] as any);

    if (templatesError) {
      console.error('Error inserting templates:', templatesError);
    }

    // Insert contract clauses
    const { error: clausesError } = await supabase
      .from("contract_clauses")
      .upsert([
        {
          id: 'confidentiality',
          title: 'Clause de Confidentialité',
          content: 'Le salarié s\'engage à ne pas divulguer, pendant et après l\'exécution du contrat, toute information confidentielle concernant l\'entreprise, ses clients, ses procédés ou ses stratégies. Cette obligation de confidentialité persiste après la fin du contrat.',
          category: 'confidentiality',
          is_active: true
        },
        {
          id: 'non_competition',
          title: 'Clause de Non-Concurrence',
          content: 'Pendant la durée du contrat et pour une période de {{non_competition_duration}} mois après sa fin, le salarié s\'engage à ne pas exercer d\'activité concurrente pour des entreprises similaires dans un rayon de {{non_competition_radius}} km. En contrepartie, l\'employeur versera une indemnité de {{non_competition_compensation}} MAD.',
          category: 'non_competition',
          is_active: true
        },
        {
          id: 'exclusivity',
          title: 'Clause d\'Exclusivité',
          content: 'Le salarié s\'engage à consacrer la totalité de son temps de travail professionnel à l\'entreprise et à n\'exercer aucune autre activité professionnelle rémunérée pendant la durée du contrat.',
          category: 'exclusivity',
          is_active: true
        },
        {
          id: 'mobility',
          title: 'Clause de Mobilité',
          content: 'Le salarié accepte d\'être amené à exercer ses fonctions sur différents sites de l\'entreprise situés sur le territoire marocain. Les changements d\'affectation seront notifiés avec un préavis de {{mobility_notice}} jours.',
          category: 'mobility',
          is_active: true
        },
        {
          id: 'training',
          title: 'Clause de Formation',
          content: 'L\'employeur s\'engage à assurer la formation continue du salarié pour l\'adaptation à l\'évolution des techniques et des qualifications. Le salarié s\'engage à participer activement aux actions de formation proposées.',
          category: 'training',
          is_active: true
        },
        {
          id: 'intellectual_property',
          title: 'Clause de Propriété Intellectuelle',
          content: 'Toutes les créations, inventions ou œuvres réalisées par le salarié dans l\'exercice de ses fonctions appartiennent à l\'employeur. Le salarié cède à l\'employeur tous les droits de propriété intellectuelle sur ces créations.',
          category: 'intellectual_property',
          is_active: true
        },
        {
          id: 'remote_work',
          title: 'Télétravail',
          content: 'Le salarié pourra être amené à exercer ses fonctions en télétravail jusqu\'à {{remote_work_days}} jours par semaine, selon les besoins de l\'entreprise et avec l\'accord des deux parties.',
          category: 'remote_work',
          is_active: true
        }
      ] as any);

    if (clausesError) {
      console.error('Error inserting clauses:', clausesError);
    }

    // Insert validation rules
    const { error: rulesError } = await supabase
      .from("contract_validation_rules")
      .upsert([
        // Required fields
        {
          id: 'employee_name_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'employee_name',
          condition_expression: 'employee_name IS NOT NULL AND employee_name != ""',
          error_message: 'Le nom du salarié est obligatoire',
          is_active: true
        },
        {
          id: 'company_name_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'company_name',
          condition_expression: 'company_name IS NOT NULL AND company_name != ""',
          error_message: 'Le nom de l\'entreprise est obligatoire',
          is_active: true
        },
        {
          id: 'salary_brut_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'salary_brut',
          condition_expression: 'salary_brut IS NOT NULL AND salary_brut > 0',
          error_message: 'Le salaire brut est obligatoire',
          is_active: true
        },
        {
          id: 'job_title_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'job_title',
          condition_expression: 'job_title IS NOT NULL AND job_title != ""',
          error_message: 'Le poste est obligatoire',
          is_active: true
        },
        {
          id: 'start_date_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'start_date',
          condition_expression: 'start_date IS NOT NULL AND start_date != ""',
          error_message: 'La date de début est obligatoire',
          is_active: true
        },
        {
          id: 'mobility_notice_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.mobility_notice',
          condition_expression: 'selected_clauses CONTAINS "mobility" AND clause_variables.mobility_notice IS NOT NULL AND clause_variables.mobility_notice > 0',
          error_message: 'Le préavis de mobilité est obligatoire et doit être supérieur à 0',
          is_active: true
        },
        {
          id: 'non_competition_duration_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.non_competition_duration',
          condition_expression: 'selected_clauses CONTAINS "non_competition" AND clause_variables.non_competition_duration IS NOT NULL AND clause_variables.non_competition_duration > 0',
          error_message: 'La durée de non-concurrence est obligatoire (mois)',
          is_active: true
        },
        {
          id: 'non_competition_radius_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.non_competition_radius',
          condition_expression: 'selected_clauses CONTAINS "non_competition" AND clause_variables.non_competition_radius IS NOT NULL AND clause_variables.non_competition_radius > 0',
          error_message: 'Le rayon de non-concurrence est obligatoire (km)',
          is_active: true
        },
        {
          id: 'non_competition_compensation_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.non_competition_compensation',
          condition_expression: 'selected_clauses CONTAINS "non_competition" AND clause_variables.non_competition_compensation IS NOT NULL AND clause_variables.non_competition_compensation > 0',
          error_message: 'L\'indemnité de non-concurrence est obligatoire (MAD)',
          is_active: true
        },
        {
          id: 'probation_extension_duration_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.probation_extension_duration',
          condition_expression: 'selected_clauses CONTAINS "probation_extension" AND clause_variables.probation_extension_duration IS NOT NULL AND clause_variables.probation_extension_duration > 0',
          error_message: 'La durée de prolongation de période d’essai est obligatoire (jours)',
          is_active: true
        },
        {
          id: 'remote_work_days_required',
          contract_type: 'ALL',
          rule_type: 'required',
          field_path: 'clause_variables.remote_work_days',
          condition_expression: 'selected_clauses CONTAINS "remote_work" AND clause_variables.remote_work_days IS NOT NULL AND clause_variables.remote_work_days > 0',
          error_message: 'Le nombre de jours de télétravail par semaine est obligatoire',
          is_active: true
        },
        // CDD specific
        {
          id: 'cdd_duration_required',
          contract_type: 'CDD',
          rule_type: 'required',
          field_path: 'contract_duration',
          condition_expression: 'contract_duration IS NOT NULL AND contract_duration > 0',
          error_message: 'La durée du CDD est obligatoire',
          is_active: true
        },
        {
          id: 'cdd_end_date_required',
          contract_type: 'CDD',
          rule_type: 'required',
          field_path: 'end_date',
          condition_expression: 'end_date IS NOT NULL AND end_date != ""',
          error_message: 'La date de fin est obligatoire pour un CDD',
          is_active: true
        },
        // Warning rules
        {
          id: 'salary_smig_warning',
          contract_type: 'ALL',
          rule_type: 'warning',
          field_path: 'salary_brut',
          condition_expression: 'salary_brut < 3000',
          error_message: 'Attention: le salaire est inférieur au SMIG (3000 MAD)',
          is_active: true
        },
        // Default values
        {
          id: 'payment_frequency_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'payment_frequency',
          value_expression: '"mensuel"',
          is_active: true
        },
        {
          id: 'work_hours_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'work_hours',
          value_expression: '"44"',
          is_active: true
        },
        {
          id: 'work_days_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'work_days',
          value_expression: '"6"',
          is_active: true
        },
        {
          id: 'trial_period_cadre_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'trial_period_duration',
          condition_expression: 'role_level = "cadre" AND (trial_period_duration IS NULL OR trial_period_duration = "")',
          value_expression: '"3 mois"',
          is_active: true
        },
        {
          id: 'trial_period_employee_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'trial_period_duration',
          condition_expression: 'role_level != "cadre" AND (trial_period_duration IS NULL OR trial_period_duration = "")',
          value_expression: '"1.5 mois"',
          is_active: true
        },
        {
          id: 'notice_period_employee_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'notice_period_employee',
          value_expression: '"15"',
          is_active: true
        },
        {
          id: 'annual_leave_days_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'annual_leave_days',
          value_expression: '"18"',
          is_active: true
        },
        {
          id: 'contract_location_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'contract_location',
          value_expression: '"Casablanca"',
          is_active: true
        },
        {
          id: 'contract_date_default',
          contract_type: 'ALL',
          rule_type: 'default',
          field_path: 'contract_date',
          value_expression: 'CURRENT_DATE',
          is_active: true
        },
        // Advanced cross-field validation rules
        {
          id: 'cdd_end_date_contract_type_required',
          contract_type: 'CDD',
          rule_type: 'required',
          field_path: 'end_date',
          condition_expression: 'contract_type == "CDD"',
          error_message: 'La date de fin est obligatoire pour les contrats CDD',
          priority: 10,
          is_active: true
        },
        {
          id: 'cdd_justification_required',
          contract_type: 'CDD',
          rule_type: 'required',
          field_path: 'cdd_justification',
          condition_expression: 'contract_type == "CDD"',
          error_message: 'Justification is required for CDD contracts per Moroccan labor law',
          priority: 10,
          is_active: true
        },
        {
          id: 'salary_minimum_wage_warning',
          contract_type: 'ALL',
          rule_type: 'warning',
          field_path: 'salary_brut',
          condition_expression: 'salary_brut < 3111',
          error_message: 'Salary is below the minimum wage (SMIG). Please verify.',
          priority: 5,
          is_active: true
        },
        {
          id: 'trial_period_cadre_max',
          contract_type: 'CDI',
          rule_type: 'warning',
          field_path: 'trial_period_duration',
          condition_expression: 'role_level == "cadre" AND trial_period_duration CONTAINS "mois"',
          error_message: 'Trial period for cadres should not exceed 3 months (renewable once)',
          priority: 5,
          is_active: true
        },
        {
          id: 'notice_period_cadre_min',
          contract_type: 'ALL',
          rule_type: 'warning',
          field_path: 'notice_period_employee',
          condition_expression: 'role_level == "cadre" AND notice_period_employee < 3',
          error_message: 'Notice period for cadres should be at least 3 months',
          priority: 5,
          is_active: true
        }
      ] as any);

    if (rulesError) {
      console.error('Error inserting rules:', rulesError);
    }
    
    // Verify the data was inserted
    const { data: templates, error: templatesVerifyError } = await supabase
      .from("contract_templates")
      .select("count")
      .eq("is_active", true);
    
    const { data: clauses, error: clausesVerifyError } = await supabase
      .from("contract_clauses")
      .select("count")
      .eq("is_active", true);
    
    const { data: rules, error: rulesVerifyError } = await supabase
      .from("contract_validation_rules")
      .select("count")
      .eq("is_active", true);

    return NextResponse.json({
      ok: true,
      message: "Contract data seeded successfully",
      counts: {
        templates: templates?.length || 0,
        clauses: clauses?.length || 0,
        rules: rules?.length || 0
      },
      errors: {
        templates: templatesError?.message,
        clauses: clausesError?.message,
        rules: rulesError?.message
      }
    });
    
  } catch (error) {
    console.error("Seed contract data error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to seed contract data: " + (error as Error).message },
      { status: 500 }
    );
  }
}
