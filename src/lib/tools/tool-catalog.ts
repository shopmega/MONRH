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
  { id: "net_gross", label: "Net <-> Brut", kind: "simulator", href: "/simulate/net-gross" },
  { id: "employer_total_cost", label: "Cout total employeur", kind: "simulator", href: "/simulate/employer-total-cost" },
  { id: "annual_income_tax", label: "IR annuel", kind: "simulator", href: "/simulate/annual-income-tax" },
  { id: "licenciement", label: "Indemnite licenciement", kind: "simulator", href: "/simulate/licenciement" },
  { id: "demission", label: "Scenario demission", kind: "simulator", href: "/simulate/demission" },
  { id: "fin_cdd", label: "Fin de CDD", kind: "simulator", href: "/simulate/fin-cdd" },
  { id: "probation_termination", label: "Rupture periode d'essai", kind: "simulator", href: "/simulate/probation-termination" },
  { id: "seniority_growth", label: "Croissance anciennete", kind: "simulator", href: "/simulate/seniority-growth" },
  { id: "leave_accrual", label: "Conges acquis", kind: "simulator", href: "/simulate/leave-accrual" },
  { id: "smig_compliance", label: "Conformite SMIG / SMAG", kind: "simulator", href: "/simulate/smig-compliance" },
  { id: "overtime", label: "Heures supplementaires", kind: "simulator", href: "/simulate/overtime" },
  { id: "public_holiday_compensation", label: "Travail jour ferie", kind: "simulator", href: "/simulate/public-holiday-compensation" },
  { id: "maternity_leave", label: "Conge maternite", kind: "simulator", href: "/simulate/maternity-leave" },
  { id: "sick_leave", label: "Arret maladie", kind: "simulator", href: "/simulate/sick-leave" },
  { id: "cnss_pension", label: "Projection pension CNSS", kind: "simulator", href: "/simulate/cnss-pension" },
  { id: "work_accident", label: "Accident du travail", kind: "simulator", href: "/simulate/work-accident" },
  { id: "harassment_scenario", label: "Scenario harcelement", kind: "simulator", href: "/simulate/harassment-scenario" },
  { id: "unpaid_salary_recovery", label: "Recouvrement salaire impaye", kind: "simulator", href: "/simulate/unpaid-salary-recovery" },
  { id: "unpaid_overtime_recovery", label: "Recouvrement heures sup", kind: "simulator", href: "/simulate/unpaid-overtime-recovery" },
  { id: "payslip_detector", label: "Detecteur fiche de paie", kind: "protection", href: "/tools/payslip-detector" },
  { id: "salary_delay_alert", label: "Alerte retard salaire", kind: "protection", href: "/tools/salary-delay-alert" },
  { id: "compliance_risk_score", label: "Score de conformite", kind: "protection", href: "/tools/compliance-risk-score" },
];

export function createDefaultToolPolicies(): Record<string, ToolPolicy> {
  return Object.fromEntries(
    TOOL_CATALOG.map((tool) => [
      tool.id,
      { visible: true, enabled: true, audience: "public" as const },
    ]),
  );
}
