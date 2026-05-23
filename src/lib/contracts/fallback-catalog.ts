import type { ContractClause, ContractTemplate, ValidationRule } from "@/lib/contracts/types";

export const fallbackContractTemplates: ContractTemplate[] = [
  {
    id: "CDI",
    title: "Contrat de travail a duree indeterminee (CDI)",
    description: "Modele CDI local conforme au parcours contractuel MONRH.",
    contract_type: "CDI",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    sections: [
      {
        id: "parties",
        title: "Parties",
        order: 1,
        content:
          "Employeur: {{company_name}}\nAdresse: {{company_address}}\nRC/ICE: {{company_rc}}\nCNSS: {{company_cnss}}\n\nSalarie: {{employee_name}}\nAdresse: {{employee_address}}\nCIN: {{employee_cin}}\nCNSS: {{employee_cnss}}",
      },
      {
        id: "job",
        title: "Fonction",
        order: 2,
        content: "Le salarie est engage en qualite de {{job_title}}.\n\nFonctions principales:\n{{job_description}}",
      },
      {
        id: "duration",
        title: "Duree",
        order: 3,
        content: "Le contrat est conclu pour une duree indeterminee et prend effet le {{start_date}}.",
      },
      {
        id: "salary",
        title: "Remuneration",
        order: 4,
        content:
          "Salaire mensuel brut: {{salary_brut}} MAD.\nPaiement: {{payment_frequency}} par {{payment_method}}.",
      },
      {
        id: "work",
        title: "Temps de travail",
        order: 5,
        content:
          "Temps de travail hebdomadaire: {{work_hours}} heures sur {{work_days}} jours.\nHoraires: {{work_schedule}}.\nConges annuels: {{annual_leave_days}} jours ouvrables.",
      },
      {
        id: "signature",
        title: "Signature",
        order: 6,
        content: "Fait a {{contract_location}}, le {{contract_date}}.\n\nSignature employeur:\n\nSignature salarie:",
      },
    ],
  },
  {
    id: "CDD",
    title: "Contrat de travail a duree determinee (CDD)",
    description: "Modele CDD local avec duree, motif et date de fin.",
    contract_type: "CDD",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    sections: [
      {
        id: "parties",
        title: "Parties",
        order: 1,
        content:
          "Employeur: {{company_name}}\nAdresse: {{company_address}}\nRC/ICE: {{company_rc}}\nCNSS: {{company_cnss}}\n\nSalarie: {{employee_name}}\nAdresse: {{employee_address}}\nCIN: {{employee_cin}}\nCNSS: {{employee_cnss}}",
      },
      {
        id: "job",
        title: "Fonction",
        order: 2,
        content: "Le salarie est engage en qualite de {{job_title}}.\n\nFonctions principales:\n{{job_description}}",
      },
      {
        id: "duration",
        title: "Duree et motif",
        order: 3,
        content:
          "Le contrat est conclu pour {{contract_duration}} mois, du {{start_date}} au {{end_date}}.\nMotif du CDD: {{cdd_justification}}.",
      },
      {
        id: "salary",
        title: "Remuneration",
        order: 4,
        content:
          "Salaire mensuel brut: {{salary_brut}} MAD.\nPaiement: {{payment_frequency}} par {{payment_method}}.",
      },
      {
        id: "work",
        title: "Temps de travail",
        order: 5,
        content:
          "Temps de travail hebdomadaire: {{work_hours}} heures sur {{work_days}} jours.\nHoraires: {{work_schedule}}.\nConges annuels: {{annual_leave_days}} jours ouvrables.",
      },
      {
        id: "signature",
        title: "Signature",
        order: 6,
        content: "Fait a {{contract_location}}, le {{contract_date}}.\n\nSignature employeur:\n\nSignature salarie:",
      },
    ],
  },
];

export const fallbackContractClauses: ContractClause[] = [
  {
    id: "confidentiality",
    title: "Clause de confidentialite",
    content:
      "Le salarie s'engage a ne pas divulguer les informations confidentielles de l'entreprise pendant et apres l'execution du contrat.",
    category: "confidentiality",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "remote_work",
    title: "Teletravail",
    content:
      "Le teletravail peut etre organise jusqu'a {{remote_work_days}} jours par semaine selon les besoins de l'entreprise et l'accord des parties.",
    category: "remote_work",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export const fallbackContractValidationRules: ValidationRule[] = [
  {
    id: "employee_name_required",
    contract_type: "ALL",
    rule_type: "required",
    field_path: "employee_name",
    error_message: "Le nom du salarie est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "company_name_required",
    contract_type: "ALL",
    rule_type: "required",
    field_path: "company_name",
    error_message: "Le nom de l'entreprise est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "job_title_required",
    contract_type: "ALL",
    rule_type: "required",
    field_path: "job_title",
    error_message: "Le poste est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "salary_brut_required",
    contract_type: "ALL",
    rule_type: "required",
    field_path: "salary_brut",
    condition_expression: "salary_brut > 0",
    error_message: "Le salaire brut est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "start_date_required",
    contract_type: "ALL",
    rule_type: "required",
    field_path: "start_date",
    error_message: "La date de debut est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cdd_end_date_required",
    contract_type: "CDD",
    rule_type: "required",
    field_path: "end_date",
    error_message: "La date de fin est obligatoire pour un CDD",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cdd_justification_required",
    contract_type: "CDD",
    rule_type: "required",
    field_path: "cdd_justification",
    error_message: "Le motif legal du CDD est obligatoire",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "salary_smig_warning",
    contract_type: "ALL",
    rule_type: "warning",
    field_path: "salary_brut",
    condition_expression: "salary_brut < 3500",
    error_message: "Le salaire semble inferieur au SMIG. Verifiez la conformite.",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export function getFallbackContractCatalog() {
  return {
    templates: fallbackContractTemplates,
    clauses: fallbackContractClauses,
    validationRules: fallbackContractValidationRules,
  };
}
