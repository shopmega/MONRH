import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Jour Ferie Travaille Maroc",
  description: "Estimez la compensation due pour un jour ferie travaille au Maroc selon les heures et le salaire.",
  canonicalPath: "/simulateurs/compensation-jours-feries",
});

export default function PublicHolidayCompensationPage() {
  return (
    <SimulatorToolPage
      title="Calcul jour ferie travaille Maroc"
      description="Estimez la compensation due pour les heures travaillees pendant un jour ferie."
      apiPath="/api/simulate/public-holiday-compensation"
      calculatorType="public_holiday_compensation"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "holidayHoursWorked", label: "Heures travaillees (jour ferie)", type: "number", min: 0, step: 0.5 },
        { key: "alreadyPaidNormalDay", label: "Jour normal deja remunere", type: "checkbox" },
      ]}
      breakdownLabels={{
        baseHourlyRate: "Taux horaire base",
        multiplierApplied: "Coefficient applique",
        compensationAmount: "Compensation estimee",
      }}
      units={{
        baseHourlyRate: "MAD",
        multiplierApplied: "x",
        compensationAmount: "MAD",
      }}
    />
  );
}
