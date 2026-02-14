import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Recouvrement Salaire Impaye",
  description: "Estimation du principal, penalites de retard et montant total de reclamation.",
  canonicalPath: "/simulate/unpaid-salary-recovery",
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
        { key: "delayMonths", label: "Mois de retard", type: "number", defaultValue: "4", min: 0, step: 1 },
        { key: "penaltyRatePerMonth", label: "Taux penalite mensuel", type: "number", defaultValue: "0.01", min: 0, max: 0.05, step: 0.001 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        principalAmount: "Principal",
        delayPenalties: "Penalites",
        totalClaimAmount: "Total reclamation",
      }}
      units={{
        principalAmount: "MAD",
        delayPenalties: "MAD",
        totalClaimAmount: "MAD",
      }}
    />
  );
}
