import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Indemnite Chomage CNSS — Eligibilite et Montant",
  description: "Verifiez votre eligibilite, estimez l'indemnite mensuelle CNSS et la duree de prise en charge apres perte d'emploi.",
  canonicalPath: "/conges-cnss/indemnite-chomage",
});

export default function UnemploymentPage() {
  return (
    <SimulatorToolPage
      title="Indemnite Chomage CNSS"
      description="Verifiez votre eligibilite a l'indemnite de perte d'emploi, estimez le montant mensuel et votre plan de survie financiere."
      apiPath="/api/simulate/unemployment"
      calculatorType="unemployment"
      fields={[
        { key: "monthlyGross", label: "Salaire brut de reference (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "contributionMonths", label: "Mois de cotisation CNSS", type: "number", min: 0, step: 1 },
        { key: "monthlyExpenses", label: "Charges mensuelles (MAD)", type: "number", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        eligible: "Eligible",
        eligibilityReason: "Statut d'eligibilite",
        "monthly.cnssIndemnity": "Indemnite mensuelle CNSS",
        "monthly.durationMonths": "Duree (mois)",
        "financialRunway.gap": "Ecart mensuel vs charges",
        "financialRunway.monthsCovered": "Mois couverts par charges",
      }}
      units={{
        "monthly.cnssIndemnity": "MAD",
        "monthly.durationMonths": "mois",
        "financialRunway.gap": "MAD",
      }}
    />
  );
}
