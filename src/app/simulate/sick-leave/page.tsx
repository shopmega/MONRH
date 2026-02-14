import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Arret Maladie",
  description: "Estimation de compensation CNSS et perte de revenu.",
  canonicalPath: "/simulateurs/conge-maladie",
});

export default function SickLeavePage() {
  return (
    <SimulatorToolPage
      title="Arret Maladie"
      description="Estimation de compensation CNSS et perte de revenu."
      apiPath="/api/simulate/sick-leave"
      calculatorType="sick_leave"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "8000", min: 1, step: 0.01 },
        { key: "sickDays", label: "Jours d'arret", type: "number", defaultValue: "10", min: 1, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        paidDaysByCnss: "Jours indemnises",
        grossIncomeEquivalent: "Equivalent brut",
        cnssCompensation: "Indemnisation CNSS",
        estimatedIncomeLoss: "Perte estimee",
      }}
      units={{
        paidDaysByCnss: "jours",
        grossIncomeEquivalent: "MAD",
        cnssCompensation: "MAD",
        estimatedIncomeLoss: "MAD",
      }}
    />
  );
}
