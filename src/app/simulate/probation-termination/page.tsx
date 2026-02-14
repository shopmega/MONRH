import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Rupture en Periode d'Essai",
  description: "Controle du preavis et de la compensation potentielle.",
  canonicalPath: "/simulate/probation-termination",
});

export default function ProbationTerminationPage() {
  return (
    <SimulatorToolPage
      title="Rupture en Periode d'Essai"
      description="Controle du preavis et de la compensation potentielle."
      apiPath="/api/simulate/probation-termination"
      calculatorType="probation_termination"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "6500", min: 1, step: 0.01 },
        { key: "workedDays", label: "Jours travailles en essai", type: "number", defaultValue: "20", min: 1, step: 1 },
        {
          key: "initiator",
          label: "Initiateur rupture",
          type: "select",
          defaultValue: "employer",
          options: [
            { label: "Employeur", value: "employer" },
            { label: "Salarie", value: "employee" },
          ],
        },
        { key: "noticeDaysGiven", label: "Preavis donne (jours)", type: "number", defaultValue: "0", min: 0, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        requiredNoticeDays: "Preavis requis",
        noticeDaysGiven: "Preavis donne",
        missingNoticeDays: "Jours manquants",
        compensationDue: "Compensation due",
      }}
      units={{
        requiredNoticeDays: "jours",
        noticeDaysGiven: "jours",
        missingNoticeDays: "jours",
        compensationDue: "MAD",
      }}
    />
  );
}
