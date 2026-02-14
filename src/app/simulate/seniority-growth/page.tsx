import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Croissance Anciennete",
  description: "Compare l'indemnite potentielle actuelle vs apres quelques annees.",
  canonicalPath: "/simulate/seniority-growth",
});

export default function SeniorityGrowthPage() {
  return (
    <SimulatorToolPage
      title="Croissance Anciennete"
      description="Compare l'indemnite potentielle actuelle vs apres quelques annees."
      apiPath="/api/simulate/seniority-growth"
      calculatorType="seniority_growth"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        { key: "currentYears", label: "Anciennete actuelle (ans)", type: "number", defaultValue: "4", min: 0, step: 1 },
        { key: "additionalYears", label: "Annees supplementaires", type: "number", defaultValue: "3", min: 0, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        currentIndemnityEstimate: "Indemnite actuelle",
        futureIndemnityEstimate: "Indemnite future",
        growthAmount: "Gain estime",
        growthPercent: "Gain relatif",
      }}
      units={{
        currentIndemnityEstimate: "MAD",
        futureIndemnityEstimate: "MAD",
        growthAmount: "MAD",
        growthPercent: "%",
      }}
    />
  );
}
