import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Scenario Promotion — Gain Net Reel",
  description: "Calculez le gain net reel d'une promotion vs l'augmentation brute affichee. Impact IR et cout employeur.",
  canonicalPath: "/carriere/promotion",
});

export default function PromotionScenarioPage() {
  return (
    <SimulatorToolPage
      title="Scenario Promotion"
      description="Ce que valent vraiment vos nouvelles responsabilites. Comparez la promesse brute avec le gain net reel apres IR."
      apiPath="/api/simulate/promotion-scenario"
      calculatorType="promotion_scenario"
      fields={[
        { key: "currentGross", label: "Salaire brut actuel (MAD)", type: "number", defaultValue: "12000", min: 1, step: 0.01 },
        { key: "proposedGross", label: "Nouveau salaire propose (MAD)", type: "number", defaultValue: "15000", min: 1, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-01-01" },
      ]}
      breakdownLabels={{
        rawRaisePercent: "Augmentation brute",
        "current.net": "Net actuel",
        "proposed.net": "Nouveau net",
        netGainMonthly: "Gain net mensuel",
        netGainAnnual: "Gain net annuel",
        realRaisePercent: "Augmentation reelle nette",
        taxGrowthPercent: "Croissance IR",
        employerCostDelta: "Cout supplementaire employeur",
      }}
      units={{
        rawRaisePercent: "%",
        "current.net": "MAD",
        "proposed.net": "MAD",
        netGainMonthly: "MAD",
        netGainAnnual: "MAD",
        realRaisePercent: "%",
        taxGrowthPercent: "%",
        employerCostDelta: "MAD",
      }}
    />
  );
}
