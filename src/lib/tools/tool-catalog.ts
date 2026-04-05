export type ToolAudience = "public" | "logged";

export type ToolPolicy = {
  visible: boolean;
  enabled: boolean;
  audience: ToolAudience;
};

export type ToolDefinition = {
  id: string;
  label: string;
  kind: "simulator" | "protection";
  href: string;
};

export const TOOL_CATALOG: ToolDefinition[] = [
  { id: "net_gross", label: "Net <-> Brut", kind: "simulator", href: "/simulateurs/brut-net" },
  { id: "employer_total_cost", label: "Cout total employeur", kind: "simulator", href: "/simulateurs/cout-employeur-total" },

  { id: "annual_income_tax", label: "IR annuel", kind: "simulator", href: "/simulateurs/ir-annuel" },
  { id: "licenciement", label: "Indemnite licenciement", kind: "simulator", href: "/simulateurs/licenciement" },
  { id: "demission", label: "Scenario demission", kind: "simulator", href: "/simulateurs/demission" },
  { id: "duree_preavis", label: "Duree de preavis", kind: "simulator", href: "/simulateurs/duree-preavis" },
  { id: "fin_cdd", label: "Fin de CDD", kind: "simulator", href: "/simulateurs/fin-cdd" },
  { id: "probation_termination", label: "Rupture periode d'essai", kind: "simulator", href: "/simulateurs/rupture-periode-essai" },
  { id: "seniority_growth", label: "Croissance anciennete", kind: "simulator", href: "/simulateurs/progression-anciennete" },

  { id: "leave_accrual", label: "Conges acquis", kind: "simulator", href: "/simulateurs/acquisition-conges" },
  { id: "smig_compliance", label: "Conformite SMIG / SMAG", kind: "simulator", href: "/simulateurs/conformite-smig" },

  { id: "overtime", label: "Heures supplementaires", kind: "simulator", href: "/simulateurs/heures-supplementaires" },
  { id: "public_holiday_compensation", label: "Travail jour ferie", kind: "simulator", href: "/simulateurs/compensation-jours-feries" },
  { id: "maternity_leave", label: "Conge maternite", kind: "simulator", href: "/simulateurs/conge-maternite" },
  { id: "sick_leave", label: "Arret maladie", kind: "simulator", href: "/simulateurs/conge-maladie" },
  { id: "cnss_pension", label: "Projection pension CNSS", kind: "simulator", href: "/simulateurs/pension-cnss" },
  { id: "work_accident", label: "Accident du travail", kind: "simulator", href: "/simulateurs/accident-travail" },
  { id: "harassment_scenario", label: "Scenario harcelement", kind: "simulator", href: "/simulateurs/scenario-harcelement" },
  { id: "unpaid_salary_recovery", label: "Recouvrement salaire impaye", kind: "simulator", href: "/simulateurs/recouvrement-salaire-impaye" },
  { id: "unpaid_overtime_recovery", label: "Recouvrement heures sup", kind: "simulator", href: "/simulateurs/recouvrement-heures-supplementaires" },

  { id: "payslip_detector", label: "Detecteur fiche de paie", kind: "protection", href: "/outils/detecteur-fiche-paie" },
  { id: "salary_delay_alert", label: "Alerte retard salaire", kind: "protection", href: "/outils/alerte-retard-salaire" },
  { id: "compliance_risk_score", label: "Score de conformite", kind: "protection", href: "/outils/score-risque-conformite" },
  { id: "final_settlement_audit", label: "Audit solde de tout compte", kind: "protection", href: "/outils/audit-solde-tout-compte" },
  { id: "disciplinary_procedure_check", label: "Controle procedure disciplinaire", kind: "protection", href: "/outils/controle-procedure-disciplinaire" },
  { id: "fixed_term_contract_risk", label: "Risque requalification CDD", kind: "protection", href: "/outils/risque-requalification-cdd" },
  { id: "pre_litigation_timeline", label: "Feuille route pre-contentieux", kind: "protection", href: "/outils/feuille-route-pre-contentieux" },
  { id: "auto_entrepreneur", label: "Auto-entrepreneur", kind: "simulator", href: "/planifier/auto-entrepreneur" },
  { id: "avantages_nature", label: "Avantages en nature", kind: "simulator", href: "/planifier/avantages-nature" },
  { id: "bonus_simulator", label: "Simulateur de prime", kind: "simulator", href: "/planifier/simulation-prime" },
  { id: "compensation_optimization", label: "Optimisation de la rémunération", kind: "simulator", href: "/planifier/optimisation-remuneration" },
  { id: "freelance_pricing", label: "Tarification freelance", kind: "simulator", href: "/planifier/tarification-freelance" },
  { id: "freelance_vs_salary", label: "Freelance vs salarié", kind: "simulator", href: "/planifier/freelance-vs-salarie" },
  { id: "hiring_cost", label: "Coût de recrutement", kind: "simulator", href: "/planifier/cout-recrutement" },
  { id: "igr_detail", label: "Calcul IGR détaillé", kind: "simulator", href: "/planifier/igr-detail" },
  { id: "loan_capacity", label: "Capacité d'emprunt", kind: "simulator", href: "/planifier/capacite-credit" },
  { id: "payroll_mass", label: "Masse salariale", kind: "simulator", href: "/planifier/masse-salariale" },
  { id: "payslip", label: "Bulletin de paie", kind: "simulator", href: "/planifier/bulletin-paie" },
  { id: "profit_expense", label: "Bénéfice et dépenses", kind: "simulator", href: "/planifier/benefice-net" },
  { id: "promotion_scenario", label: "Scénario de promotion", kind: "simulator", href: "/planifier/scenario-promotion" },
  { id: "retirement_advanced", label: "Retraite avancée", kind: "simulator", href: "/planifier/retraite-avancee" },
  { id: "salary_increase", label: "Augmentation de salaire", kind: "simulator", href: "/planifier/augmentation-salaire" },
  { id: "unemployment", label: "Indemnité chômage", kind: "simulator", href: "/planifier/indemnite-chomage" },
  { id: "licenciement_enhanced", label: "Licenciement amélioré", kind: "simulator", href: "/simulate/licenciement-enhanced" },
  { id: "net_gross_enhanced", label: "Net/Brut amélioré", kind: "simulator", href: "/simulate/net-gross-enhanced" },
];

export function createDefaultToolPolicies(): Record<string, ToolPolicy> {
  return Object.fromEntries(
    TOOL_CATALOG.map((tool) => [
      tool.id,
      { visible: true, enabled: true, audience: "public" as const },
    ]),
  );
}
