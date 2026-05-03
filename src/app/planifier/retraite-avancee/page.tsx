import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Retraite Avancee CNSS — Projection de Pension",
  description: "Projetez votre pension CNSS selon votre carriere, votre taux de remplacement et l'ecart a combler.",
  canonicalPath: "/conges-cnss/retraite-cnss",
});

export default function RetirementAdvancedPage() {
  return (
    <SimulatorToolPage
      title="Retraite Avancee CNSS"
      description="Projection detaillee de votre pension selon votre trajectoire de carriere, cotisations et taux de remplacement. Identifiez l'ecart a couvrir par l'epargne."
      apiPath="/api/simulate/retirement-advanced"
      calculatorType="retirement_advanced"
      fields={[
        { key: "currentAge", label: "Age actuel", type: "number", min: 20, max: 59, step: 1 },
        { key: "retirementAge", label: "Age de depart (retraite)", type: "number", min: 55, max: 65, step: 1 },
        { key: "currentGross", label: "Salaire brut actuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "annualRaisePercent", label: "Hausse annuelle salaire (%)", type: "number", min: 0, max: 20, step: 0.1 },
        { key: "contributionMonths", label: "Mois de cotisation actuels", type: "number", min: 0, step: 1 },
        { key: "desiredMonthlyPension", label: "Pension recherchee (MAD)", type: "number", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        yearsToRetirement: "Annees restantes",
        totalContributionMonthsAtRetirement: "Mois cotises total",
        projectedPension: "Pension projetee",
        replacementRate: "Taux de remplacement",
        lastSalaryAtRetirement: "Dernier salaire projete",
        "gap.vsLastSalary": "Ecart vs dernier salaire",
        "gap.vsDesiredPension": "Ecart vs pension souhaitee",
      }}
      units={{
        projectedPension: "MAD",
        replacementRate: "%",
        lastSalaryAtRetirement: "MAD",
        "gap.vsLastSalary": "MAD",
        "gap.vsDesiredPension": "MAD",
      }}
    />
  );
}
