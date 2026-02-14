import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Heures Supplementaires",
  description: "Calculez les majorations jour, nuit, weekend et jours feries.",
  canonicalPath: "/simulate/overtime",
});

export default function OvertimePage() {
  return (
    <SimulatorToolPage
      title="Heures Supplementaires"
      description="Calculez les majorations jour, nuit, weekend et jours feries."
      apiPath="/api/simulate/overtime"
      calculatorType="overtime"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 0, step: 0.01 },
        { key: "overtimeDayHours", label: "Heures sup de jour", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "overtimeNightHours", label: "Heures sup de nuit", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "overtimeWeekendHours", label: "Heures sup weekend", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "overtimeHolidayHours", label: "Heures sup jour ferie", type: "number", defaultValue: "0", min: 0, step: 0.5 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        baseHourlyRate: "Taux horaire base",
        dayAmount: "Montant jour",
        nightAmount: "Montant nuit",
        weekendAmount: "Montant weekend",
        holidayAmount: "Montant ferie",
        totalOvertimeAmount: "Total heures sup",
      }}
      units={{
        baseHourlyRate: "MAD",
        dayAmount: "MAD",
        nightAmount: "MAD",
        weekendAmount: "MAD",
        holidayAmount: "MAD",
        totalOvertimeAmount: "MAD",
      }}
    />
  );
}
