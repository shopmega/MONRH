import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Cout Total Employeur",
  description: "Projection du cout mensuel complet pour l'entreprise.",
  canonicalPath: "/simulateurs/cout-employeur-total",
});

export default function EmployerTotalCostPage() {
  return (
    <SimulatorToolPage
      title="Cout Total Employeur"
      description="Projection du cout mensuel complet pour l'entreprise."
      apiPath="/api/simulate/employer-total-cost"
      calculatorType="employer_total_cost"
      fields={[
        { key: "grossSalary", label: "Salaire brut (MAD)", type: "number", min: 1, step: 0.01 },
        {
          key: "companySize",
          label: "Taille entreprise",
          type: "select",
          options: [
            { label: "<= 20 salaries", value: "small" },
            { label: "> 20 salaries", value: "large" },
          ],
        },
        {
          key: "sectorRisk",
          label: "Risque secteur (AT/MP)",
          type: "select",
          options: [
            { label: "Faible", value: "low" },
            { label: "Moyen", value: "medium" },
            { label: "Eleve", value: "high" },
            { label: "Tres eleve", value: "very_high" },
          ],
        },
        { key: "additionalBenefitsMad", label: "Avantages complementaires (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "months", label: "Nombre de mois", type: "number", min: 1, max: 14, step: 1 },
        { key: "include13thMonth", label: "Inclure 13e mois", type: "checkbox" },
      ]}
      breakdownLabels={{
        grossSalary: "Brut",
        cnssEmployer: "CNSS employeur",
        amoEmployer: "AMO employeur",
        atMpInsurance: "AT/MP",
        formationPro: "Formation pro",
        additionalBenefits: "Avantages",
        monthlyTotalCost: "Cout mensuel",
        annualTotalCost: "Cout annuel",
        annualCostWithBonus: "Cout annuel avec bonus",
        effectiveBurdenRatePercent: "Taux de charges",
      }}
      units={{
        grossSalary: "MAD",
        cnssEmployer: "MAD",
        amoEmployer: "MAD",
        atMpInsurance: "MAD",
        formationPro: "MAD",
        additionalBenefits: "MAD",
        monthlyTotalCost: "MAD",
        annualTotalCost: "MAD",
        annualCostWithBonus: "MAD",
        effectiveBurdenRatePercent: "%",
      }}
    />
  );
}
