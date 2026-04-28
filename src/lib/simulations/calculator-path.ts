import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

/** Hub / intent URLs that still host result pages and bookmarks; must match `calculatorType` ids */
export const LEGACY_CALCULATOR_PATHS: Partial<Record<string, readonly string[]>> = {
  net_gross: ["/salaire/brut-net", "/simulateurs/brut-net", "/simulate/net-gross"],
  annual_income_tax: ["/salaire/ir-igr", "/simulateurs/ir-annuel", "/simulate/annual-income-tax"],
  employer_total_cost: ["/rh-pro/cout-employeur-total", "/simulateurs/cout-employeur-total", "/simulate/employer-total-cost"],
  licenciement: ["/contrat-depart/licenciement", "/simulateurs/licenciement", "/simulate/licenciement"],
  demission: ["/contrat-depart/demission", "/simulateurs/demission", "/simulate/demission"],
  duree_preavis: ["/contrat-depart/duree-preavis", "/simulateurs/duree-preavis", "/simulate/duree-preavis"],
  fin_cdd: ["/contrat-depart/fin-cdd", "/simulateurs/fin-cdd", "/simulate/fin-cdd"],
  probation_termination: ["/contrat-depart/periode-essai", "/simulateurs/rupture-periode-essai", "/simulate/probation-termination"],
  seniority_growth: ["/contrat-depart/anciennete-indemnites", "/simulateurs/progression-anciennete", "/simulate/seniority-growth"],
  leave_accrual: ["/conges-cnss/conges-acquis", "/simulateurs/acquisition-conges", "/simulate/leave-accrual"],
  smig_compliance: ["/salaire/smig-smag", "/simulateurs/conformite-smig", "/simulate/smig-compliance"],
  overtime: ["/conges-cnss/heures-supplementaires", "/simulateurs/heures-supplementaires", "/simulate/overtime"],
  public_holiday_compensation: ["/conges-cnss/jour-ferie", "/simulateurs/compensation-jours-feries", "/simulate/public-holiday-compensation"],
  maternity_leave: ["/conges-cnss/conge-maternite", "/simulateurs/conge-maternite", "/simulate/maternity-leave"],
  sick_leave: ["/conges-cnss/arret-maladie", "/simulateurs/conge-maladie", "/simulate/sick-leave"],
  cnss_pension: ["/conges-cnss/pension-cnss", "/simulateurs/pension-cnss", "/simulate/cnss-pension"],
  work_accident: ["/conges-cnss/accident-travail", "/simulateurs/accident-travail", "/simulate/work-accident"],
  harassment_scenario: ["/litiges/harcelement", "/simulateurs/scenario-harcelement", "/simulate/harassment-scenario"],
  unpaid_salary_recovery: ["/litiges/salaire-impaye", "/simulateurs/recouvrement-salaire-impaye", "/simulate/unpaid-salary-recovery"],
  unpaid_overtime_recovery: ["/litiges/heures-sup-impayees", "/simulateurs/recouvrement-heures-supplementaires", "/simulate/unpaid-overtime-recovery"],
};

export function calculatorTypeToPath(calculatorType: string): string | null {
  const match = TOOL_CATALOG.find(
    (tool) => tool.kind === "simulator" && tool.id === calculatorType,
  );
  return match?.href ?? null;
}

/** Resolve simulator calculator type from canonical tool path or legacy hub path. */
export function pathToCalculatorType(pathname: string): string | null {
  const canonical = TOOL_CATALOG.find(
    (tool) => tool.kind === "simulator" && tool.href === pathname,
  );
  if (canonical) return canonical.id;

  for (const [calculatorType, paths] of Object.entries(LEGACY_CALCULATOR_PATHS)) {
    if (paths?.includes(pathname)) {
      return calculatorType;
    }
  }
  return null;
}

/** True if the current result URL matches the saved simulation's calculator (canonical or legacy hub path). */
export function savedSimulationPathMatches(
  expectedPath: string,
  calculatorType: string,
  canonicalPath: string | null,
): boolean {
  if (canonicalPath == null) return true;
  if (expectedPath === canonicalPath) return true;
  return LEGACY_CALCULATOR_PATHS[calculatorType]?.includes(expectedPath) ?? false;
}
