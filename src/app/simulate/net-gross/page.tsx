import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Salaire Net / Brut",
  description: "Resultat detaille avec charges sociales, IR et cout employeur.",
  canonicalPath: "/salaire/brut-net",
});

export default function NetGrossSimulationPage() {
  return (
    <SimulatorToolPage
      title="Salaire Net / Brut"
      description="Resultat detaille avec charges sociales, IR et cout employeur."
      apiPath="/api/simulate/net-gross"
      calculatorType="net_gross"
      fields={[
        {
          key: "direction",
          label: "Direction",
          type: "select",
          defaultValue: "gross_to_net",
          options: [
            { label: "Brut vers Net", value: "gross_to_net" },
            { label: "Net vers Brut", value: "net_to_gross" },
          ],
        },
        { key: "amount", label: "Montant (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
        { key: "includeCimr", label: "Inclure CIMR (6%)", type: "checkbox", defaultValue: false },
      ]}
      breakdownLabels={{
        gross: "Brut",
        net: "Net",
        taxableIncome: "Revenu imposable",
        cnssEmployee: "CNSS salarie",
        cnssEmployer: "CNSS employeur",
        amoEmployee: "AMO salarie",
        amoEmployer: "AMO employeur",
        cimrEmployee: "CIMR salarie",
        incomeTax: "IR",
        professionalExpenseDeduction: "Abattement frais pro",
        employerTotalCost: "Cout employeur",
      }}
      units={{
        gross: "MAD",
        net: "MAD",
        taxableIncome: "MAD",
        cnssEmployee: "MAD",
        cnssEmployer: "MAD",
        amoEmployee: "MAD",
        amoEmployer: "MAD",
        cimrEmployee: "MAD",
        incomeTax: "MAD",
        professionalExpenseDeduction: "MAD",
        employerTotalCost: "MAD",
      }}
    />
  );
}
