import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

/** Hub / intent URLs that still host result pages and bookmarks; must match `calculatorType` ids */
export const LEGACY_CALCULATOR_PATHS: Partial<Record<string, readonly string[]>> = {
  net_gross: ["/salaire/brut-net"],
  annual_income_tax: ["/salaire/ir-igr"],
  employer_total_cost: ["/rh-pro/cout-employeur-total"],
  licenciement: ["/contrat-depart/licenciement"],
  demission: ["/contrat-depart/demission"],
  duree_preavis: ["/contrat-depart/duree-preavis"],
  fin_cdd: ["/contrat-depart/fin-cdd"],
  probation_termination: ["/contrat-depart/periode-essai"],
  seniority_growth: ["/contrat-depart/anciennete-indemnites"],
  leave_accrual: ["/conges-cnss/conges-acquis"],
  smig_compliance: ["/salaire/smig-smag"],
  overtime: ["/conges-cnss/heures-supplementaires"],
  public_holiday_compensation: ["/conges-cnss/jour-ferie"],
  maternity_leave: ["/conges-cnss/conge-maternite"],
  sick_leave: ["/conges-cnss/arret-maladie"],
  cnss_pension: ["/conges-cnss/pension-cnss"],
  work_accident: ["/conges-cnss/accident-travail"],
  harassment_scenario: ["/litiges/harcelement"],
  unpaid_salary_recovery: ["/litiges/salaire-impaye"],
  unpaid_overtime_recovery: ["/litiges/heures-sup-impayees"],
};

export function calculatorTypeToPath(calculatorType: string): string | null {
  const match = TOOL_CATALOG.find(
    (tool) => tool.kind === "simulator" && tool.id === calculatorType,
  );
  return match?.href ?? null;
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
