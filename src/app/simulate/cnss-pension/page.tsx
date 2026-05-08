import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Projection Pension CNSS",
  description: "Estimation simplifiee de pension mensuelle selon salaire moyen et jours cotises.",
  canonicalPath: "/simulateurs/pension-cnss",
});

export default function CnssPensionPage() {
  return (
    <SimulatorToolPage
      title="Projection Pension CNSS"
      description="Estimation simplifiee de pension mensuelle selon salaire moyen et jours cotises."
      apiPath="/api/simulate/cnss-pension"
      calculatorType="cnss_pension"
      fields={[
        { key: "averageSalary", label: "Salaire moyen (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "contributionDays", label: "Jours cotises CNSS", type: "number", min: 1, step: 1 },
        { key: "birthDate", label: "Date de naissance", type: "date", required: false },
        { key: "retirementAge", label: "Age de depart", type: "number", min: 50, step: 1, defaultValue: 60 },
        { key: "salaryGrowthRatePercent", label: "Croissance salaire annuelle (%)", type: "number", min: 0, max: 20, step: 0.5, defaultValue: 0 },
        { key: "additionalContributionYears", label: "Annees de cotisation supplementaires", type: "number", min: 0, max: 30, step: 1, defaultValue: 0 },
        { key: "hasCimr", label: "Cotisation CIMR", type: "checkbox", defaultValue: false },
        { key: "cimrMonthlyEstimate", label: "Estimation pension CIMR (MAD)", type: "number", min: 0, step: 0.01, defaultValue: 0 },
      ]}
      breakdownLabels={{
        cnssEligible: "Eligibilite CNSS",
        projectedContributionDays: "Jours cotises projetes",
        openingContributionDaysRequired: "Seuil ouverture",
        fullFormulaContributionDaysRequired: "Base formule pleine",
        projectedRetirementAge: "Age projete",
        projectedAverageSalary: "Salaire moyen projete",
        replacementRatePercent: "Taux remplacement",
        estimatedMonthlyPensionCnss: "Pension mensuelle CNSS",
        estimatedAnnualPensionCnss: "Pension annuelle CNSS",
        cimrMonthlyEstimate: "Pension mensuelle CIMR",
        combinedMonthlyEstimate: "Pension mensuelle combinee",
        replacementRateCombinedPercent: "Taux remplacement combine",
      }}
      units={{
        projectedContributionDays: "jours",
        openingContributionDaysRequired: "jours",
        fullFormulaContributionDaysRequired: "jours",
        projectedRetirementAge: "ans",
        replacementRatePercent: "%",
        projectedAverageSalary: "MAD",
        estimatedMonthlyPensionCnss: "MAD",
        estimatedAnnualPensionCnss: "MAD",
        cimrMonthlyEstimate: "MAD",
        combinedMonthlyEstimate: "MAD",
        replacementRateCombinedPercent: "%",
      }}
    />
  );
}
