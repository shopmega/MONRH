import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Conge Maternite",
  description: "Projection de revenu pendant conge maternite (CNSS + complement).",
  canonicalPath: "/simulateurs/conge-maternite",
});

export default function MaternityLeavePage() {
  return (
    <SimulatorToolPage
      title="Conge Maternite"
      description="Projection de revenu pendant conge maternite (CNSS + complement)."
      apiPath="/api/simulate/maternity-leave"
      calculatorType="maternity_leave"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date", required: false },
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "expectedDeliveryDate", label: "Date prevue d'accouchement", type: "date", required: false },
        { key: "leaveStartDate", label: "Debut conge maternite", type: "date", required: false },
        { key: "leaveEndDate", label: "Fin conge maternite", type: "date", required: false },
        { key: "cnssContributedMonths", label: "Mois cotises CNSS (10 derniers mois)", type: "number", min: 0, max: 10, step: 1 },
        { key: "employerTopUp", label: "Complement employeur", type: "checkbox" },
        { key: "multipleChildBirth", label: "Naissance multiple", type: "checkbox" },
        { key: "prematureOrIllNewborn", label: "Nouveau-ne premature ou malade", type: "checkbox" },
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
