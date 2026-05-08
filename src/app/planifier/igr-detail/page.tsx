import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "IGR Detail — Taux Marginal et Effectif",
  description: "Detail complet de l'IR mensuel par tranche, taux marginal vs effectif, et reconciliation annuelle.",
  canonicalPath: "/salaire/ir-igr",
});

export default function IGRDetailPage() {
  return (
    <SimulatorToolPage
      title="IGR Detail — Mensuel & Annuel"
      description="Devenez l'outil IR de reference. Detail par tranche, taux marginal vs effectif, et projection de regularisation annuelle."
      apiPath="/api/simulate/igr-detail"
      calculatorType="igr_detail"
      fields={[
        { key: "grossSalary", label: "Salaire brut mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "includeCimr", label: "Inclure CIMR", type: "checkbox" },
        { key: "annualBonusGross", label: "Primes annuelles brutes (MAD)", type: "number", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        "monthly.gross": "Salaire brut",
        "monthly.cnssEmployee": "CNSS salarie",
        "monthly.amoEmployee": "AMO salarie",
        "monthly.cimrEmployee": "CIMR salarie",
        "monthly.professionalExpenseDeduction": "Abattement frais pro",
        "monthly.taxableIncome": "Revenu imposable",
        "monthly.incomeTax": "IR mensuel",
        "monthly.net": "Net mensuel",
        "monthly.marginalRate": "Taux marginal",
        "monthly.effectiveRate": "Taux effectif",
        "annual.grossWithBonus": "Brut annuel + Primes",
        "annual.estimatedAnnualTax": "IR annuel estime",
        "annual.effectiveAnnualRate": "Taux effectif annuel",
        "annual.regularizationDelta": "Delta regularisation",
      }}
      units={{
        "monthly.gross": "MAD",
        "monthly.cnssEmployee": "MAD",
        "monthly.amoEmployee": "MAD",
        "monthly.cimrEmployee": "MAD",
        "monthly.professionalExpenseDeduction": "MAD",
        "monthly.taxableIncome": "MAD",
        "monthly.incomeTax": "MAD",
        "monthly.net": "MAD",
        "monthly.marginalRate": "%",
        "monthly.effectiveRate": "%",
        "annual.grossWithBonus": "MAD",
        "annual.estimatedAnnualTax": "MAD",
        "annual.effectiveAnnualRate": "%",
        "annual.regularizationDelta": "MAD",
      }}
    />
  );
}
