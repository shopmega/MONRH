import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul IR Maroc et Cotisations CNSS",
  description: "Simulez votre impot sur le revenu au Maroc avec salaire annuel, bonus, 13e mois et charges sociales.",
  canonicalPath: "/simulateurs/ir-annuel",
});

export default function AnnualIncomeTaxPage() {
  return (
    <SimulatorToolPage
      title="Calcul IR Maroc"
      description="Calculez l'impot sur le revenu au Maroc avec salaire annuel, bonus, 13e mois et charges sociales."
      apiPath="/api/simulate/annual-income-tax"
      calculatorType="annual_income_tax"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "paidMonths", label: "Mois remuneres", type: "number", min: 1, max: 14, step: 1 },
        { key: "bonusAmount", label: "Bonus annuel (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "include13thSalary", label: "Inclure 13e mois", type: "checkbox" },
      ]}
      breakdownLabels={{
        annualGrossIncome: "Brut annuel",
        annualProfessionalDeduction: "Deduction pro",
        annualSocialContributions: "Charges sociales",
        annualTaxableIncome: "Revenu taxable",
        annualIncomeTax: "IR annuel",
        monthlyAverageTax: "IR mensuel moyen",
        effectiveTaxRatePercent: "Taux effectif",
      }}
      units={{
        annualGrossIncome: "MAD",
        annualProfessionalDeduction: "MAD",
        annualSocialContributions: "MAD",
        annualTaxableIncome: "MAD",
        annualIncomeTax: "MAD",
        monthlyAverageTax: "MAD",
        effectiveTaxRatePercent: "%",
      }}
    />
  );
}
