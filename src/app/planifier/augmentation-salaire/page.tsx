import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Simulateur Augmentation Salaire",
  description: "Calculez votre gain net reel apres augmentation brute: IR, CNSS, cout employeur compare.",
  canonicalPath: "/carriere/augmentation-salaire",
});

export default function SalaryIncreasePage() {
  return (
    <SimulatorToolPage
      title="Augmentation Salaire — Gain Net Reel"
      description="Comparez votre salaire actuel et la proposition. Visualisez le gain net reel apres impots et le cout supplementaire pour l'employeur."
      apiPath="/api/simulate/salary-increase"
      calculatorType="salary_increase"
      fields={[
        { key: "currentGross", label: "Salaire brut actuel (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "newGross", label: "Salaire brut propose (MAD)", type: "number", defaultValue: "12000", min: 1, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-01-01" },
        { key: "includeCimr", label: "Inclure CIMR (6%)", type: "checkbox", defaultValue: false },
      ]}
      breakdownLabels={{
        currentGross: "Brut actuel",
        newGross: "Nouveau brut",
        rawIncreasePercent: "Augmentation brute",
        "current.net": "Net actuel",
        "proposed.net": "Nouveau net",
        "netGain.monthly": "Gain net mensuel",
        "netGain.annual": "Gain net annuel",
        "netGain.realIncreasePercent": "Augmentation nette reelle",
        "netGain.employerCostDelta": "Cout supplementaire employeur",
      }}
      units={{
        currentGross: "MAD",
        newGross: "MAD",
        rawIncreasePercent: "%",
        "current.net": "MAD",
        "proposed.net": "MAD",
        "netGain.monthly": "MAD",
        "netGain.annual": "MAD",
        "netGain.realIncreasePercent": "%",
        "netGain.employerCostDelta": "MAD",
      }}
    />
  );
}
