import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Benefice Net — Charges vs Profit Freelance",
  description: "Calculez votre benefice net reel apres deduction de toutes vos charges professionnelles et impots.",
  canonicalPath: "/carriere/benefice-net",
});

export default function ProfitExpensePage() {
  return (
    <SimulatorToolPage
      title="Benefice Net (Charges vs Profit)"
      description="Votre rentabilite reelle. Entrez votre chiffre d'affaires et vos charges par categorie pour voir votre profit net et votre marge."
      apiPath="/api/simulate/profit-expense"
      calculatorType="profit_expense"
      fields={[
        { key: "monthlyRevenue", label: "Chiffre d'affaires mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "taxRate", label: "Taux d'imposition (%)", type: "number", min: 0, max: 0.5, step: 0.01 },
        { key: "cnssMonthly", label: "CNSS mensuel (MAD)", type: "number", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        monthlyRevenue: "CA mensuel",
        totalExpenses: "Total charges",
        tax: "Impots",
        cnss: "CNSS",
        grossProfit: "Benefice brut",
        netProfit: "Benefice net",
        netMargin: "Marge nette",
        "annualProjection.revenue": "CA annuel",
        "annualProjection.netProfit": "Profit net annuel",
      }}
      units={{
        monthlyRevenue: "MAD",
        totalExpenses: "MAD",
        tax: "MAD",
        grossProfit: "MAD",
        netProfit: "MAD",
        netMargin: "%",
        "annualProjection.revenue": "MAD",
        "annualProjection.netProfit": "MAD",
      }}
    />
  );
}
