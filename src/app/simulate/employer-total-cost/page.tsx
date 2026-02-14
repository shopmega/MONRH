import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Cout Total Employeur",
  description: "Projection du cout mensuel complet pour l'entreprise.",
  canonicalPath: "/simulate/employer-total-cost",
});

export default function EmployerTotalCostPage() {
  return (
    <SimulatorToolPage
      title="Cout Total Employeur"
      description="Projection du cout mensuel complet pour l'entreprise."
      apiPath="/api/simulate/employer-total-cost"
      calculatorType="employer_total_cost"
      fields={[
        { key: "grossSalary", label: "Salaire brut (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        { key: "insuranceRate", label: "Taux assurance employeur", type: "number", defaultValue: "0.015", min: 0, step: 0.001 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        grossSalary: "Brut",
        cnssEmployer: "CNSS employeur",
        amoEmployer: "AMO employeur",
        insuranceEmployer: "Assurance",
        totalCostToCompany: "Cout total",
      }}
      units={{
        grossSalary: "MAD",
        cnssEmployer: "MAD",
        amoEmployer: "MAD",
        insuranceEmployer: "MAD",
        totalCostToCompany: "MAD",
      }}
    />
  );
}
