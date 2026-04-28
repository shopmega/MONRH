import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Majoration Salaire Maroc: Heures Supplementaires",
  description: "Calculez les majorations de salaire au Maroc pour heures supplementaires, nuit, weekend et jours feries.",
  canonicalPath: "/simulateurs/heures-supplementaires",
});

export default function OvertimePage() {
  return (
    <SimulatorToolPage
      title="Majoration salaire Maroc"
      description="Calculez les majorations pour heures supplementaires de jour, nuit, weekend et jours feries."
      apiPath="/api/simulate/overtime"
      calculatorType="overtime"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 0, step: 0.01 },
        { key: "overtimeDayHours", label: "Heures sup de jour", type: "number", min: 0, step: 0.5, defaultValue: 0 },
        { key: "overtimeNightHours", label: "Heures sup de nuit", type: "number", min: 0, step: 0.5, defaultValue: 0 },
        { key: "overtimeRestOrHolidayDayHours", label: "Heures repos/ferie de jour", type: "number", min: 0, step: 0.5, defaultValue: 0 },
        { key: "overtimeRestOrHolidayNightHours", label: "Heures repos/ferie de nuit", type: "number", min: 0, step: 0.5, defaultValue: 0 },
      ]}
      breakdownLabels={{
        baseHourlyRate: "Taux horaire base",
        dayAmount: "Montant jour",
        nightAmount: "Montant nuit",
        restOrHolidayDayAmount: "Montant repos/ferie jour",
        restOrHolidayNightAmount: "Montant repos/ferie nuit",
        totalOvertimeAmount: "Total heures sup",
      }}
      units={{
        baseHourlyRate: "MAD",
        dayAmount: "MAD",
        nightAmount: "MAD",
        restOrHolidayDayAmount: "MAD",
        restOrHolidayNightAmount: "MAD",
        totalOvertimeAmount: "MAD",
      }}
    />
  );
}
