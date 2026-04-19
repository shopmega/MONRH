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
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "unpaidMonths", label: "Mois impayes", type: "number", min: 1, step: 1 },
        { key: "partialPaymentPerMonth", label: "Paiement partiel mensuel (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "monthsSinceFirstDefault", label: "Mois depuis le premier impaye", type: "number", min: 1, max: 120, step: 1 },
        { key: "penaltyRateAnnual", label: "Taux de penalite annuel (%)", type: "number", min: 0, max: 50, step: 0.1 },
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
