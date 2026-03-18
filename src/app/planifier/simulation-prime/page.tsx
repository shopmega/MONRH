import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Simulateur Prime / Bonus — Net Reel",
  description: "Calculez le net de votre prime apres pic de taxation IR. Decouvrez le taux effectif reel de votre bonus.",
  canonicalPath: "/planifier/simulation-prime",
});

export default function BonusSimulatorPage() {
  return (
    <SimulatorToolPage
      title="Simulation Prime / Bonus"
      description="Comprenez le vrai net de votre prime apres sa cumulation avec le salaire mensuel et le pic d'IR associe."
      apiPath="/api/simulate/bonus-simulator"
      calculatorType="bonus_simulator"
      fields={[
        { key: "monthlySalaryGross", label: "Salaire mensuel brut (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "bonusGross", label: "Prime brute (MAD)", type: "number", defaultValue: "5000", min: 1, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-01-01" },
      ]}
      breakdownLabels={{
        monthlySalaryGross: "Salaire brut mensuel",
        bonusGross: "Prime brute",
        bonusNet: "Prime nette recue",
        bonusEffectiveRate: "Taux effectif prime",
        taxSpike: "Pic IR ce mois",
        "normalMonth.net": "Net mois normal",
        "bonusMonth.net": "Net mois avec prime",
        "normalMonth.marginalRate": "Tranche marginale normale",
        "bonusMonth.marginalRate": "Tranche marginale prime",
      }}
      units={{
        monthlySalaryGross: "MAD",
        bonusGross: "MAD",
        bonusNet: "MAD",
        bonusEffectiveRate: "%",
        taxSpike: "MAD",
        "normalMonth.net": "MAD",
        "bonusMonth.net": "MAD",
      }}
    />
  );
}
