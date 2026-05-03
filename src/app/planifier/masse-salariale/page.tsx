import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Masse Salariale — Simulation RH",
  description: "Simulez le cout total de votre equipe avec charges employeur, CNSS et formation professionnelle.",
  canonicalPath: "/rh-pro/masse-salariale",
});

export default function PayrollMassPage() {
  return (
    <SimulatorToolPage
      title="Masse Salariale (RH / Entreprise)"
      description="Simulez le cout total d'une equipe. Entrez le nombre d'employes et leur salaire brut moyen pour obtenir le cout employeur global."
      apiPath="/api/simulate/payroll-mass"
      calculatorType="payroll_mass"
      fields={[
        { key: "employeeCount", label: "Nombre d'employes", type: "number", min: 1, step: 1 },
        { key: "averageGrossSalary", label: "Salaire brut moyen (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "companySize", label: "Taille entreprise", type: "select", options: [
          { label: "Grande (> 20 employes, 1.6% FP)", value: "large" },
          { label: "Petite (≤ 20 employes, 1% FP)", value: "small" },
        ]},
      ]}
      breakdownLabels={{
        employeeCount: "Nombre d'employes",
        averageSalary: "Salaire brut moyen",
        "totals.totalGross": "Masse brute totale",
        "totals.totalNet": "Total net a payer",
        "totals.totalEmployerCost": "Cout total employeur",
        "totals.totalCnssEmployee": "CNSS salaries total",
        "totals.totalCnssEmployer": "CNSS employeur total",
        "totals.totalIncomeTax": "IR total retenu",
        "totals.totalFormationPro": "Formation pro total",
      }}
      units={{
        averageSalary: "MAD",
        "totals.totalGross": "MAD",
        "totals.totalNet": "MAD",
        "totals.totalEmployerCost": "MAD",
        "totals.totalCnssEmployee": "MAD",
        "totals.totalCnssEmployer": "MAD",
        "totals.totalIncomeTax": "MAD",
        "totals.totalFormationPro": "MAD",
      }}
    />
  );
}
