import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Salaire Brut Net Maroc",
  description: "Calculez votre salaire brut en net au Maroc avec CNSS, AMO, IR et cout employeur.",
  canonicalPath: "/simulateurs/brut-net",
});

export default function NetGrossSimulationPage() {
  return (
    <SimulatorToolPage
      title="Calcul salaire brut net Maroc"
      description="Simulez votre salaire net ou brut au Maroc avec le detail CNSS, AMO, IR et cout employeur."
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
        { key: "amount", label: "Montant (MAD)", type: "number", min: 1, step: 0.01 },
        {
          key: "familySituation",
          label: "Situation familiale",
          type: "select",
          defaultValue: "single",
          options: [
            { label: "Celibataire", value: "single" },
            { label: "Marie(e)", value: "married" },
            { label: "Divorce(e)", value: "divorced" },
            { label: "Veuf(ve)", value: "widowed" },
          ],
        },
        { key: "familyDependentsCount", label: "Personnes a charge", type: "stepper", min: 0, max: 6, defaultValue: 0 },
        { key: "additionalDeductionsAnnual", label: "Deductions annuelles supplementaires (MAD)", type: "number", min: 0, step: 0.01, defaultValue: 0 },
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
        familyTaxReduction: "Reduction charges de famille",
        additionalDeductions: "Deductions mensuelles",
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
        familyTaxReduction: "MAD",
        additionalDeductions: "MAD",
        incomeTax: "MAD",
        professionalExpenseDeduction: "MAD",
        employerTotalCost: "MAD",
      }}
    />
  );
}
