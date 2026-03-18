import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Comparaison de Scenarios — Rapport de Decision",
  description: "Comparez deux scenarios (offres, situations) cote a cote et generez un rapport de decision chiffre.",
  canonicalPath: "/planifier/comparaison-scenarios",
});

export default function ScenarioComparisonPage() {
  return (
    <SimulatorToolPage
      title="Comparaison de Scenarios"
      description="Placez deux situations cote a cote: deux offres d'emploi, deux villes, deux postes. Comparez les nets, les couts et generez un rapport de decision."
      apiPath="/api/simulate/salary-increase"
      calculatorType="salary_increase"
      fields={[
        { key: "currentGross", label: "Scenario A — Salaire brut (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "newGross", label: "Scenario B — Salaire brut (MAD)", type: "number", defaultValue: "13000", min: 1, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-01-01" },
        { key: "includeCimr", label: "Inclure CIMR", type: "checkbox", defaultValue: false },
      ]}
      breakdownLabels={{
        "current.net": "Net Scenario A",
        "proposed.net": "Net Scenario B",
        "netGain.monthly": "Ecart mensuel",
        "netGain.annual": "Ecart annuel",
        "netGain.realIncreasePercent": "Difference nette reelle (%)",
        "current.employerTotalCost": "Cout employeur A",
        "proposed.employerTotalCost": "Cout employeur B",
      }}
      units={{
        "current.net": "MAD",
        "proposed.net": "MAD",
        "netGain.monthly": "MAD",
        "netGain.annual": "MAD",
        "netGain.realIncreasePercent": "%",
        "current.employerTotalCost": "MAD",
        "proposed.employerTotalCost": "MAD",
      }}
    />
  );
}
