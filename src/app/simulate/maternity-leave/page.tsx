import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Conge Maternite",
  description: "Projection de revenu pendant conge maternite (CNSS + complement).",
  canonicalPath: "/conges-cnss/conge-maternite",
});

export default function MaternityLeavePage() {
  return (
    <SimulatorToolPage
      title="Conge Maternite"
      description="Projection de revenu pendant conge maternite (CNSS + complement)."
      apiPath="/api/simulate/maternity-leave"
      calculatorType="maternity_leave"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        { key: "leaveWeeks", label: "Duree du conge (semaines)", type: "number", defaultValue: "14", min: 1, step: 1 },
        { key: "cnssContributedMonths", label: "Mois cotises CNSS (10 derniers mois)", type: "number", defaultValue: "5", min: 0, max: 10, step: 1 },
        { key: "employerTopUp", label: "Complement employeur", type: "checkbox", defaultValue: false },
        { key: "multipleChildBirth", label: "Naissance multiple", type: "checkbox", defaultValue: false },
        { key: "prematureOrIllNewborn", label: "Nouveau-ne premature ou malade", type: "checkbox", defaultValue: false },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        cnssEligible: "Eligible CNSS",
        legalLeaveWeeks: "Conge legal",
        coveredWeeksByCnss: "Semaines couvertes CNSS",
        leaveMonthsEquivalent: "Equivalent mois",
        cnssCompensation: "CNSS",
        employerTopUpAmount: "Complement employeur",
        totalEstimatedIncome: "Total revenu estime",
        incomeGapPercent: "Ecart revenu",
      }}
      units={{
        legalLeaveWeeks: "semaines",
        coveredWeeksByCnss: "semaines",
        leaveMonthsEquivalent: "mois",
        cnssCompensation: "MAD",
        employerTopUpAmount: "MAD",
        totalEstimatedIncome: "MAD",
        incomeGapPercent: "%",
      }}
    />
  );
}
