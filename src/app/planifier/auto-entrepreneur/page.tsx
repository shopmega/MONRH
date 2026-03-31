import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Auto-Entrepreneur — Net Apres Impot",
  description: "Calculez votre revenu net apres impot AE (1%/2%), CNSS optionnel et projection annuelle au Maroc.",
  canonicalPath: "/planifier/auto-entrepreneur",
});

export default function AutoEntrepreneurPage() {
  return (
    <SimulatorToolPage
      title="Simulateur Auto-Entrepreneur"
      description="Calculez votre revenu net reel apres le taux AE (1% commerce / 2% services), CNSS volontaire et vos charges professionnelles."
      apiPath="/api/simulate/auto-entrepreneur"
      calculatorType="auto_entrepreneur"
      fields={[
        { key: "monthlyRevenue", label: "Chiffre d'affaires mensuel (MAD)", type: "number", defaultValue: "15000", min: 1, step: 0.01 },
        { key: "activityType", label: "Type d'activite", type: "select", defaultValue: "services", options: [
          { label: "Prestations de services (2%)", value: "services" },
          { label: "Commerce / Artisanat (1%)", value: "trade" },
          { label: "Professions liberales (2%)", value: "liberal" },
        ]},
        { key: "voluntaryCnssMonthly", label: "Cotisation CNSS volontaire (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "monthlyExpenses", label: "Charges professionnelles (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        monthlyRevenue: "CA mensuel",
        taxRate: "Taux AE",
        tax: "Impot mensuel",
        cnss: "CNSS volontaire",
        expenses: "Charges pro",
        netIncome: "Revenu net",
        profitMargin: "Marge nette",
        "annualProjection.revenue": "CA annuel",
        "annualProjection.net": "Net annuel",
      }}
      units={{
        monthlyRevenue: "MAD",
        taxRate: "%",
        tax: "MAD",
        cnss: "MAD",
        expenses: "MAD",
        netIncome: "MAD",
        profitMargin: "%",
        "annualProjection.revenue": "MAD",
        "annualProjection.net": "MAD",
      }}
    />
  );
}
