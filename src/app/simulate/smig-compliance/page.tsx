import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

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
          defaultValue: "smig",
          options: [
            { label: "SMIG", value: "smig" },
            { label: "SMAG", value: "smag" },
          ],
        },
        { key: "currentSalaryMad", label: "Salaire mensuel actuel (MAD)", type: "number", defaultValue: "3500", min: 0, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        salaryType: "Type",
        currentSalaryMad: "Salaire actuel",
        minimumRequiredMad: "Minimum requis",
        gapMad: "Ecart",
        compliant: "Conforme",
      }}
      units={{
        currentSalaryMad: "MAD",
        minimumRequiredMad: "MAD",
        gapMad: "MAD",
      }}
    />
  );
}
