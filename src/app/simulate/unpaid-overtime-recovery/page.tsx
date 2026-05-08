import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Recouvrement Heures Sup Impayees",
  description: "Estimation du rappel d'heures supplementaires et penalites de retard.",
  canonicalPath: "/simulateurs/recouvrement-heures-supplementaires",
});

export default function UnpaidOvertimeRecoveryPage() {
  return (
    <SimulatorToolPage
      title="Recouvrement Heures Sup Impayees"
      description="Estimation du rappel d'heures supplementaires et penalites de retard."
      apiPath="/api/simulate/unpaid-overtime-recovery"
      calculatorType="unpaid_overtime_recovery"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date" },
        { key: "periodStartDate", label: "Debut periode reclamee", type: "date" },
        { key: "periodEndDate", label: "Fin periode reclamee", type: "date" },
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "unpaidDayHours", label: "Heures jour impayees", type: "number", min: 0, step: 0.5 },
        { key: "unpaidNightHours", label: "Heures nuit impayees", type: "number", min: 0, step: 0.5 },
        { key: "unpaidWeekendHours", label: "Heures weekend impayees", type: "number", min: 0, step: 0.5 },
        { key: "unpaidHolidayHours", label: "Heures feriees impayees", type: "number", min: 0, step: 0.5 },
        { key: "delayMonths", label: "Mois de retard", type: "number", min: 0, step: 1 },
        { key: "contractualPenaltyRatePerMonth", label: "Taux contractuel/judiciaire mensuel", type: "number", min: 0, max: 0.05, step: 0.001 },
        { key: "hasTimesheets", label: "Pointages disponibles", type: "checkbox" },
        { key: "hasManagerApproval", label: "Validation manager disponible", type: "checkbox" },
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
