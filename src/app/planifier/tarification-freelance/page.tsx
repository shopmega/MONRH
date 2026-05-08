import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Tarification Freelance — Calculer son TJM",
  description: "Calculez votre tarif journalier moyen (TJM) pour atteindre votre objectif de revenu net en freelance au Maroc.",
  canonicalPath: "/carriere/tarification-freelance",
});

export default function FreelancePricingPage() {
  return (
    <SimulatorToolPage
      title="Tarification Freelance — TJM"
      description="A partir de votre objectif de revenu net mensuel, calculez le tarif journalier minimum (TJM) et le CA requis, en tenant compte de l'impot AE et de votre agenda."
      apiPath="/api/simulate/freelance-pricing"
      calculatorType="freelance_pricing"
      fields={[
        { key: "targetMonthlyNet", label: "Objectif net mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "activityType", label: "Type d'activite AE", type: "select", options: [
          { label: "Services / Liberal (2%)", value: "services" },
          { label: "Commerce / Artisanat (1%)", value: "trade" },
        ]},
        { key: "voluntaryCnssMonthly", label: "CNSS volontaire (MAD/mois)", type: "number", min: 0, step: 0.01 },
        { key: "monthlyExpenses", label: "Charges mensuelles (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "billedDaysPerMonth", label: "Jours facturables/mois", type: "number", min: 1, max: 31, step: 1 },
        { key: "vacationWeeksPerYear", label: "Semaines de vacances/an", type: "number", min: 0, max: 12, step: 1 },
      ]}
      breakdownLabels={{
        targetMonthlyNet: "Objectif net",
        requiredMonthlyRevenue: "CA mensuel requis",
        requiredAnnualRevenue: "CA annuel requis",
        tjmRequired: "TJM minimum",
        tjmWithBuffer: "TJM recommande (+20%)",
        netBilledDaysPerYear: "Jours facturables/an",
      }}
      units={{
        targetMonthlyNet: "MAD",
        requiredMonthlyRevenue: "MAD",
        requiredAnnualRevenue: "MAD",
        tjmRequired: "MAD",
        tjmWithBuffer: "MAD",
        netBilledDaysPerYear: "jours",
      }}
    />
  );
}
