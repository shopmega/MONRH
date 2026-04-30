import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Conges Acquis",
  description: "Calculez les jours acquis, le reliquat et l'impact de l'anciennete.",
  canonicalPath: "/simulateurs/acquisition-conges",
});

export default function LeaveAccrualPage() {
  return (
    <SimulatorToolPage
      title="Conges Acquis"
      description="Calculez les jours acquis, le reliquat et l'impact de l'anciennete."
      apiPath="/api/simulate/leave-accrual"
      calculatorType="leave_accrual"
      fields={[
        { key: "hireDate", label: "Date d'embauche", type: "date" },
        { key: "usedLeaveDays", label: "Conges utilises (jours)", type: "number", min: 0, step: 0.5 },
        { key: "carriedDays", label: "Reliquat reporte (jours)", type: "number", min: 0, step: 0.5 },
      ]}
      breakdownLabels={{
        accrualDays: "Acquis",
        hireDate: "Date d'embauche",
        monthsWorked: "Mois travailles",
        seniorityYears: "Anciennete",
        seniorityBonusDays: "Bonus anciennete",
        totalAvailableDays: "Total disponible",
        usedLeaveDays: "Consomme",
        remainingDays: "Restant",
        carryoverAfterLimit: "Reportable",
      }}
      units={{
        accrualDays: "jours",
        seniorityYears: "ans",
        seniorityBonusDays: "jours",
        totalAvailableDays: "jours",
        usedLeaveDays: "jours",
        remainingDays: "jours",
        carryoverAfterLimit: "jours",
      }}
    />
  );
}
