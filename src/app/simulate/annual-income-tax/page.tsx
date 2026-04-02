import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "IR Annuel",
  description: "Simulation annuelle de l'impot sur le revenu avec bonus et 13e mois.",
  canonicalPath: "/salaire/ir-igr",
});

export default function AnnualIncomeTaxPage() {
  return (
    <SimulatorToolPage
      title="IR Annuel"
      description="Simulation annuelle de l'impot sur le revenu avec bonus et 13e mois."
      apiPath="/api/simulate/annual-income-tax"
      calculatorType="annual_income_tax"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        { key: "paidMonths", label: "Mois remuneres", type: "number", defaultValue: "12", min: 1, max: 14, step: 1 },
        { key: "bonusAmount", label: "Bonus annuel (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "include13thSalary", label: "Inclure 13e mois", type: "checkbox", defaultValue: false },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
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
