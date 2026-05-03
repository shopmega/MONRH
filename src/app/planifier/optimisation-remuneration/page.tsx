import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Optimisation Remuneration — Structure Salariale",
  description: "Comparez salaire pur vs salaire + prime vs salaire + avantages. Trouvez la structure qui maximise votre net.",
  canonicalPath: "/salaire/optimisation-remuneration",
});

export default function CompensationOptimizationPage() {
  return (
    <SimulatorToolPage
      title="Optimisation de Remuneration"
      description="Meme budget employeur, net different. Comparez 3 structures salariales pour trouver la plus avantageuse apres impots."
      apiPath="/api/simulate/compensation-optimization"
      calculatorType="compensation_optimization"
      fields={[
        { key: "salaryOnlyGross", label: "Scenario 1: Salaire pur brut (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "salaryWithBonusGross", label: "Scenario 2: Salaire base (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "annualBonusGross", label: "Scenario 2: Prime annuelle (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "salaryWithBenefitsGross", label: "Scenario 3: Salaire (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "benefitsMonthlyValue", label: "Scenario 3: Avantages/mois (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "totalBudget", label: "Budget employeur total (MAD)", type: "number", min: 1, step: 0.01 },
      ]}
      breakdownLabels={{
        bestNetScenario: "Meilleur scenario (net)",
        bestEfficiencyScenario: "Meilleur scenario (efficacite)",
        "scenarios.0.netMonthly": "S1 net mensuel",
        "scenarios.0.taxEfficiency": "S1 efficacite",
        "scenarios.1.netMonthly": "S2 net mensuel",
        "scenarios.1.taxEfficiency": "S2 efficacite",
        "scenarios.2.netMonthly": "S3 net mensuel",
        "scenarios.2.taxEfficiency": "S3 efficacite",
      }}
      units={{
        "scenarios.0.netMonthly": "MAD",
        "scenarios.0.taxEfficiency": "%",
        "scenarios.1.netMonthly": "MAD",
        "scenarios.1.taxEfficiency": "%",
        "scenarios.2.netMonthly": "MAD",
        "scenarios.2.taxEfficiency": "%",
      }}
    />
  );
}
