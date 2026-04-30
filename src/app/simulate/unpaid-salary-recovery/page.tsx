import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Recouvrement Salaire Impaye",
  description: "Estimation du principal, penalites de retard et montant total de reclamation.",
  canonicalPath: "/simulateurs/recouvrement-salaire-impaye",
});

export default function UnpaidSalaryRecoveryPage() {
  return (
    <SimulatorToolPage
      title="Recouvrement Salaire Impaye"
      description="Estimation du principal, penalites de retard et montant total de reclamation."
      apiPath="/api/simulate/unpaid-salary-recovery"
      calculatorType="unpaid_salary_recovery"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date" },
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "firstUnpaidDate", label: "Premier mois impaye", type: "date" },
        { key: "lastUnpaidDate", label: "Dernier mois impaye", type: "date" },
        { key: "partialPaymentPerMonth", label: "Paiement partiel mensuel (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "contractualPenaltyRateAnnual", label: "Taux contractuel/judiciaire annuel (%)", type: "number", min: 0, max: 50, step: 0.1 },
        { key: "hasPayslips", label: "Bulletins de paie disponibles", type: "checkbox" },
        { key: "hasBankStatements", label: "Releves bancaires disponibles", type: "checkbox" },
      ]}
      breakdownLabels={{
        claimableMonths: "Mois reclamables",
        prescribedMonths: "Mois prescrits",
        principalAmount: "Principal",
        delayPenalties: "Penalites",
        totalClaimAmount: "Total reclamation",
        prescriptionRisk: "Risque prescription",
      }}
      units={{
        principalAmount: "MAD",
        delayPenalties: "MAD",
        totalClaimAmount: "MAD",
      }}
    />
  );
}
