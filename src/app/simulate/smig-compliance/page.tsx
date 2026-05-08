import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Conformite SMIG / SMAG",
  description: "Verifiez si le salaire saisi respecte le minimum legal applicable.",
  canonicalPath: "/simulateurs/conformite-smig",
});

export default function SmigCompliancePage() {
  return (
    <SimulatorToolPage
      title="Conformite SMIG / SMAG"
      description="Verifiez si le salaire saisi respecte le minimum legal applicable."
      apiPath="/api/simulate/smig-compliance"
      calculatorType="smig_compliance"
      fields={[
        {
          key: "salaryType",
          label: "Type de seuil",
          type: "select",
          options: [
            { label: "SMIG", value: "smig" },
            { label: "SMAG", value: "smag" },
          ],
        },
        { key: "baseSalaryMad", label: "Salaire de base (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "actualMonthlyHours", label: "Heures mensuelles reelles", type: "number", min: 1, max: 300, step: 1 },
        { key: "fixedAllowancesMad", label: "Primes fixes (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "includeAllowancesInCheck", label: "Inclure primes fixes", type: "checkbox" },
      ]}
      breakdownLabels={{
        salaryType: "Type",
        smigHourlyRate: "Taux legal",
        legalMinimumForActualHours: "Minimum legal",
        baseSalaryMad: "Salaire de base",
        effectiveSalaryForCheck: "Salaire controle",
        gapMad: "Ecart",
        compliant: "Conforme",
      }}
      units={{
        smigHourlyRate: "MAD",
        legalMinimumForActualHours: "MAD",
        baseSalaryMad: "MAD",
        effectiveSalaryForCheck: "MAD",
        gapMad: "MAD",
      }}
    />
  );
}
