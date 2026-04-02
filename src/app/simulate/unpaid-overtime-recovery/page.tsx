import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Recouvrement Heures Sup Impayees",
  description: "Estimation du rappel d'heures supplementaires et penalites de retard.",
  canonicalPath: "/litiges/heures-sup-impayees",
});

export default function UnpaidOvertimeRecoveryPage() {
  return (
    <SimulatorToolPage
      title="Recouvrement Heures Sup Impayees"
      description="Estimation du rappel d'heures supplementaires et penalites de retard."
      apiPath="/api/simulate/unpaid-overtime-recovery"
      calculatorType="unpaid_overtime_recovery"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "8000", min: 1, step: 0.01 },
        { key: "unpaidDayHours", label: "Heures jour impayees", type: "number", defaultValue: "12", min: 0, step: 0.5 },
        { key: "unpaidNightHours", label: "Heures nuit impayees", type: "number", defaultValue: "4", min: 0, step: 0.5 },
        { key: "unpaidWeekendHours", label: "Heures weekend impayees", type: "number", defaultValue: "3", min: 0, step: 0.5 },
        { key: "unpaidHolidayHours", label: "Heures feriees impayees", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "delayMonths", label: "Mois de retard", type: "number", defaultValue: "4", min: 0, step: 1 },
        { key: "penaltyRatePerMonth", label: "Taux penalite mensuel", type: "number", defaultValue: "0.01", min: 0, max: 0.05, step: 0.001 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        overtimePrincipal: "Principal heures sup",
        delayPenalties: "Penalites",
        totalClaimAmount: "Total reclamation",
      }}
      units={{
        overtimePrincipal: "MAD",
        delayPenalties: "MAD",
        totalClaimAmount: "MAD",
      }}
    />
  );
}
