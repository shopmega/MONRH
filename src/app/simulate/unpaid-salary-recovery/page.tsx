import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Recouvrement Salaire Impaye",
  description: "Estimation du principal, penalites de retard et montant total de reclamation.",
  canonicalPath: "/litiges/salaire-impaye",
});

export default function UnpaidSalaryRecoveryPage() {
  return (
    <SimulatorToolPage
      title="Recouvrement Salaire Impaye"
      description="Estimation du principal, penalites de retard et montant total de reclamation."
      apiPath="/api/simulate/unpaid-salary-recovery"
      calculatorType="unpaid_salary_recovery"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "7000", min: 1, step: 0.01 },
        { key: "unpaidMonths", label: "Mois impayes", type: "number", defaultValue: "2", min: 1, step: 1 },
        { key: "partialPaymentPerMonth", label: "Paiement partiel mensuel (MAD)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "monthsSinceFirstDefault", label: "Mois depuis le premier impaye", type: "number", defaultValue: "4", min: 1, max: 120, step: 1 },
        { key: "penaltyRateAnnual", label: "Taux de penalite annuel (%)", type: "number", defaultValue: "7", min: 0, max: 50, step: 0.1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
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
