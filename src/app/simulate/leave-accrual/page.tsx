import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Conges Acquis",
  description: "Calculez les jours acquis, le reliquat et l'impact de l'anciennete.",
  canonicalPath: "/conges-cnss/conges-acquis",
});

export default function LeaveAccrualPage() {
  return (
    <SimulatorToolPage
      title="Conges Acquis"
      description="Calculez les jours acquis, le reliquat et l'impact de l'anciennete."
      apiPath="/api/simulate/leave-accrual"
      calculatorType="leave_accrual"
      fields={[
        { key: "monthsWorked", label: "Mois travailles", type: "number", defaultValue: "12", min: 0, step: 1 },
        { key: "seniorityYears", label: "Anciennete (ans)", type: "number", defaultValue: "2", min: 0, step: 1 },
        { key: "usedLeaveDays", label: "Conges utilises (jours)", type: "number", defaultValue: "4", min: 0, step: 0.5 },
        { key: "carriedDays", label: "Reliquat reporte (jours)", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        accrualDays: "Acquis",
        seniorityBonusDays: "Bonus anciennete",
        totalAvailableDays: "Total disponible",
        usedLeaveDays: "Consomme",
        remainingDays: "Restant",
        carryoverAfterLimit: "Reportable",
      }}
      units={{
        accrualDays: "jours",
        seniorityBonusDays: "jours",
        totalAvailableDays: "jours",
        usedLeaveDays: "jours",
        remainingDays: "jours",
        carryoverAfterLimit: "jours",
      }}
    />
  );
}
