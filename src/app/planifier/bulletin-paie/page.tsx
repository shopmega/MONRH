import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Bulletin de Paie — Generateur Complet",
  description: "Generez un bulletin de paie marocain complet et conforme. CNSS, AMO, CIMR, IR et charges employeur.",
  canonicalPath: "/planifier/bulletin-paie",
});

export default function PayslipPage() {
  return (
    <SimulatorToolPage
      title="Bulletin de Paie (Generateur)"
      description="Generez un bulletin de paie marocain complet avec CNSS, AMO, CIMR, IR et le detail des charges employeur par periode."
      apiPath="/api/simulate/payslip"
      calculatorType="payslip"
      fields={[
        { key: "employeeName", label: "Nom du salarie", type: "text", defaultValue: "Salarie Demo" },
        { key: "period", label: "Periode (ex: Mars 2026)", type: "text", defaultValue: "Mars 2026" },
        { key: "grossSalary", label: "Salaire brut de base (MAD)", type: "number", defaultValue: "10000", min: 1, step: 0.01 },
        { key: "overtimePay", label: "Heures sup (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "bonus", label: "Prime/Bonus (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "allowances", label: "Indemnites (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-01-01" },
        { key: "includeCimr", label: "Inclure CIMR", type: "checkbox", defaultValue: false },
        { key: "companySize", label: "Taille entreprise", type: "select", defaultValue: "large", options: [
          { label: "Grande (> 20 employes, 1.6% FP)", value: "large" },
          { label: "Petite (≤ 20 employes, 1% FP)", value: "small" },
        ]},
      ]}
      breakdownLabels={{
        "earnings.totalGross": "Total brut",
        "earnings.baseSalary": "Salaire de base",
        "earnings.overtimePay": "Heures supplementaires",
        "earnings.bonus": "Prime",
        "deductions.cnssEmployee": "CNSS salarie",
        "deductions.amoEmployee": "AMO salarie",
        "deductions.incomeTax": "IR retenu",
        "deductions.totalDeductions": "Total retenues",
        netToPay: "Net a payer",
        "employerContributions.totalEmployerCost": "Cout total employeur",
      }}
      units={{
        "earnings.totalGross": "MAD",
        "earnings.baseSalary": "MAD",
        "deductions.cnssEmployee": "MAD",
        "deductions.amoEmployee": "MAD",
        "deductions.incomeTax": "MAD",
        "deductions.totalDeductions": "MAD",
        netToPay: "MAD",
        "employerContributions.totalEmployerCost": "MAD",
      }}
    />
  );
}
