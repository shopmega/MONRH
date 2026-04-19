import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Cout de Recrutement — Simulation Embauche",
  description: "Calculez le cout total d'un recrutement: charges employeur, cabinet, onboarding et equipement.",
  canonicalPath: "/rh-pro/cout-recrutement",
});

export default function HiringCostPage() {
  return (
    <SimulatorToolPage
      title="Cout de Recrutement"
      description="Le vrai cout d'une embauche depasse largement le salaire brut. Estimez le cout total premiere annee incluant charges, cabinet de recrutement, onboarding et equipement."
      apiPath="/api/simulate/hiring-cost"
      calculatorType="hiring_cost"
      fields={[
        { key: "offeredGross", label: "Salaire brut offert (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "companySize", label: "Taille entreprise", type: "select", options: [
          { label: "Grande (> 20 employes)", value: "large" },
          { label: "Petite (≤ 20 employes)", value: "small" },
        ]},
        { key: "recruitmentAgencyFeePercent", label: "Frais cabinet recrutement (% salaire annuel)", type: "number", min: 0, max: 0.3, step: 0.01 },
        { key: "jobBoardCost", label: "Cout offres emploi (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "onboardingMonths", label: "Mois d'onboarding", type: "number", min: 0, max: 6, step: 1 },
        { key: "equipmentCost", label: "Equipement / materiel (MAD)", type: "number", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        offeredGross: "Salaire brut offert",
        "monthly.baseEmployerCost": "Cout mensuel employeur",
        "annual.totalSalaryCost": "Cout salarial annuel",
        "annual.recruitmentFee": "Frais cabinet",
        "annual.onboardingOpportunityCost": "Cout onboarding",
        "annual.equipmentCost": "Equipement",
        "annual.totalFirstYearCost": "Cout total 1ere annee",
      }}
      units={{
        offeredGross: "MAD",
        "monthly.baseEmployerCost": "MAD",
        "annual.totalSalaryCost": "MAD",
        "annual.recruitmentFee": "MAD",
        "annual.onboardingOpportunityCost": "MAD",
        "annual.equipmentCost": "MAD",
        "annual.totalFirstYearCost": "MAD",
      }}
    />
  );
}
