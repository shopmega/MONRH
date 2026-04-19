import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Freelance vs Salarie — Comparaison Nette",
  description: "Comparez le net salarie vs auto-entrepreneur a revenus equivalents. Seuil de basculement et avantages caches.",
  canonicalPath: "/carriere/freelance-vs-salarie",
});

export default function FreelanceVsSalariePage() {
  return (
    <SimulatorToolPage
      title="Freelance vs Salarie"
      description="La plus grande decision de carriere. Comparez votre net salarial vs votre net en freelance (auto-entrepreneur). Incluant les avantages caches du salariat."
      apiPath="/api/simulate/freelance-vs-salary"
      calculatorType="freelance_vs_salary"
      fields={[
        { key: "salaryGross", label: "Salaire brut actuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "freelanceMonthlyRevenue", label: "CA mensuel freelance (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "activityType", label: "Type d'activite AE", type: "select", options: [
          { label: "Prestations de services (2%)", value: "services" },
          { label: "Commerce / Artisanat (1%)", value: "trade" },
        ]},
        { key: "voluntaryCnssMonthly", label: "Cotisation CNSS volontaire (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "workingMonthsPerYear", label: "Mois facturables/an", type: "number", min: 1, max: 12, step: 1 },
      ]}
      breakdownLabels={{
        "salaried.net": "Net salarie",
        "salaried.annualNet": "Net annuel salarie",
        "salaried.hiddenBenefitsValue": "Avantages caches (est.)",
        "freelance.net": "Net freelance mensuel",
        "freelance.annualNet": "Net annuel freelance",
        "freelance.tax": "Impot AE mensuel",
        "comparison.monthlyNetDelta": "Ecart mensuel net",
        "comparison.breakEvenRevenue": "CA seuil d'egalite",
        "comparison.freelanceAdvantage": "Avantage freelance",
      }}
      units={{
        "salaried.net": "MAD",
        "salaried.annualNet": "MAD",
        "salaried.hiddenBenefitsValue": "MAD",
        "freelance.net": "MAD",
        "freelance.annualNet": "MAD",
        "freelance.tax": "MAD",
        "comparison.monthlyNetDelta": "MAD",
        "comparison.breakEvenRevenue": "MAD",
      }}
    />
  );
}
