import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import {
  SimulatorToolPage as SimulatorToolPageClient,
  type SimulatorToolPageProps,
} from "@/components/simulator-tool-page";

const SIMULATOR_PATHS: Record<string, string> = {
  annual_income_tax: "/simulateurs/ir-annuel",
  auto_entrepreneur: "/carriere/auto-entrepreneur",
  avantages_nature: "/planifier/avantages-nature",
  bonus_simulator: "/planifier/simulation-prime",
  cnss_pension: "/simulateurs/pension-cnss",
  compensation_optimization: "/planifier/optimisation-remuneration",
  demission: "/simulateurs/demission",
  duree_preavis: "/simulateurs/duree-preavis",
  employer_total_cost: "/simulateurs/cout-employeur-total",
  fin_cdd: "/simulateurs/fin-cdd",
  freelance_pricing: "/planifier/tarification-freelance",
  freelance_vs_salary: "/carriere/freelance-vs-salarie",
  harassment_scenario: "/simulateurs/scenario-harcelement",
  hiring_cost: "/planifier/cout-recrutement",
  igr_detail: "/planifier/igr-detail",
  leave_accrual: "/simulateurs/acquisition-conges",
  licenciement: "/simulateurs/licenciement",
  licenciement_enhanced: "/simulateurs/licenciement-avance",
  loan_capacity: "/planifier/capacite-credit",
  maternity_leave: "/simulateurs/conge-maternite",
  net_gross: "/simulateurs/brut-net",
  net_gross_enhanced: "/simulateurs/brut-net-avance",
  overtime: "/simulateurs/heures-supplementaires",
  payroll_mass: "/planifier/masse-salariale",
  payslip: "/planifier/bulletin-paie",
  probation_termination: "/simulateurs/rupture-periode-essai",
  profit_expense: "/planifier/benefice-net",
  promotion_scenario: "/carriere/promotion",
  public_holiday_compensation: "/simulateurs/compensation-jours-feries",
  retirement_advanced: "/planifier/retraite-avancee",
  salary_increase: "/carriere/augmentation-salaire",
  seniority_growth: "/simulateurs/progression-anciennete",
  sick_leave: "/simulateurs/conge-maladie",
  smig_compliance: "/simulateurs/conformite-smig",
  unemployment: "/planifier/indemnite-chomage",
  unpaid_overtime_recovery: "/simulateurs/recouvrement-heures-supplementaires",
  unpaid_salary_recovery: "/simulateurs/recouvrement-salaire-impaye",
  work_accident: "/simulateurs/accident-travail",
};

const TITLE_PATHS: Record<string, string> = {
  "Comparaison scenarios salaire": "/carriere/comparaison-scenarios",
};

export function SimulatorToolPage(props: SimulatorToolPageProps) {
  const path = TITLE_PATHS[props.title] ?? SIMULATOR_PATHS[props.calculatorType] ?? "/";

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: props.title, href: path }]} />
      <SimulatorToolPageClient {...props} />
    </>
  );
}
