import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Avantages en Nature — Valeur Imposable",
  description: "Calculez la valeur imposable de vos avantages (voiture, logement, repas) et votre remuneration reelle totale.",
  canonicalPath: "/salaire/avantages-nature",
});

export default function AvantagesNaturePage() {
  return (
    <SimulatorToolPage
      title="Avantages en Nature — Remuneration Reelle"
      description="Rendez visibles vos avantages caches. Calculez la valeur imposable de chaque avantage selon les regles DGI et votre remuneration totale reelle."
      apiPath="/api/simulate/avantages-nature"
      calculatorType="avantages_nature"
      fields={[
        { key: "grossSalary", label: "Salaire brut mensuel (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "companyVehicle", label: "Vehicule de societe", type: "checkbox", defaultValue: false },
        { key: "vehicleValue", label: "Valeur vehicule (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "housingProvided", label: "Logement de fonction", type: "checkbox", defaultValue: false },
        { key: "housingMonthlyValue", label: "Valeur logement (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "mealVouchers", label: "Tickets repas (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "phoneSubscription", label: "Forfait telephone (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "transportAllowance", label: "Indemnite transport (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
      ]}
      breakdownLabels={{
        grossSalary: "Salaire brut",
        "summary.totalEmployerCost": "Cout total avantages (employeur)",
        "summary.totalTaxableValue": "Valeur imposable avantages",
        "summary.totalNonTaxableValue": "Valeur non-imposable",
        "summary.realTotalCompensation": "Remuneration reelle totale",
        "summary.taxableTotalCompensation": "Base imposable totale",
        "summary.percentBenefitsInTotal": "Part avantages (%)",
      }}
      units={{
        grossSalary: "MAD",
        "summary.totalEmployerCost": "MAD",
        "summary.totalTaxableValue": "MAD",
        "summary.totalNonTaxableValue": "MAD",
        "summary.realTotalCompensation": "MAD",
        "summary.taxableTotalCompensation": "MAD",
        "summary.percentBenefitsInTotal": "%",
      }}
    />
  );
}
