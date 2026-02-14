import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Projection Pension CNSS",
  description: "Estimation simplifiee de pension mensuelle selon salaire moyen et jours cotises.",
  canonicalPath: "/simulate/cnss-pension",
});

export default function CnssPensionPage() {
  return (
    <SimulatorToolPage
      title="Projection Pension CNSS"
      description="Estimation simplifiee de pension mensuelle selon salaire moyen et jours cotises."
      apiPath="/api/simulate/cnss-pension"
      calculatorType="cnss_pension"
      fields={[
        { key: "averageSalary", label: "Salaire moyen (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        { key: "contributionDays", label: "Jours cotises CNSS", type: "number", defaultValue: "4320", min: 1, step: 1 },
        { key: "retirementAge", label: "Age de depart", type: "number", defaultValue: "60", min: 50, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        replacementRatePercent: "Taux remplacement",
        estimatedMonthlyPension: "Pension mensuelle",
        estimatedAnnualPension: "Pension annuelle",
      }}
      units={{
        replacementRatePercent: "%",
        estimatedMonthlyPension: "MAD",
        estimatedAnnualPension: "MAD",
      }}
    />
  );
}
