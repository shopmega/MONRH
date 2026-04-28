import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getOvertimeRulesByDate } from "@/lib/rules/default-rules";

export const overtimeInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  overtimeDayHours: z.number().min(0).default(0),
  overtimeNightHours: z.number().min(0).default(0),
  overtimeRestOrHolidayDayHours: z.number().min(0).default(0),
  overtimeRestOrHolidayNightHours: z.number().min(0).default(0),
  /** Legacy fields accepted for existing bookmarks/payloads. */
  overtimeWeekendHours: z.number().min(0).optional(),
  overtimeHolidayHours: z.number().min(0).optional(),
});

export type OvertimeInput = z.input<typeof overtimeInputSchema>;

export type OvertimeResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    baseHourlyRate: number;
    dayAmount: number;
    nightAmount: number;
    restOrHolidayDayAmount: number;
    restOrHolidayNightAmount: number;
    totalOvertimeAmount: number;
  };
  explanation: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
  };
};

function roundMAD(value: number) {
  return Math.round(value * 100) / 100;
}

export function simulateOvertime(rawInput: OvertimeInput): OvertimeResult {
  const input = overtimeInputSchema.parse(rawInput);
  const rules = getOvertimeRulesByDate(input.calculationDate);
  const baseHourlyRate = input.monthlySalary / rules.monthlyReferenceHours;
  const restOrHolidayDayHours =
    input.overtimeRestOrHolidayDayHours + (input.overtimeWeekendHours ?? 0);
  const restOrHolidayNightHours =
    input.overtimeRestOrHolidayNightHours + (input.overtimeHolidayHours ?? 0);
  const dayAmount = input.overtimeDayHours * baseHourlyRate * rules.dayMultiplier;
  const nightAmount = input.overtimeNightHours * baseHourlyRate * rules.nightMultiplier;
  const restOrHolidayDayAmount =
    restOrHolidayDayHours * baseHourlyRate * rules.weekendMultiplier;
  const restOrHolidayNightAmount =
    restOrHolidayNightHours * baseHourlyRate * rules.holidayMultiplier;
  const totalOvertimeAmount = dayAmount + nightAmount + restOrHolidayDayAmount + restOrHolidayNightAmount;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      baseHourlyRate: roundMAD(baseHourlyRate),
      dayAmount: roundMAD(dayAmount),
      nightAmount: roundMAD(nightAmount),
      restOrHolidayDayAmount: roundMAD(restOrHolidayDayAmount),
      restOrHolidayNightAmount: roundMAD(restOrHolidayNightAmount),
      totalOvertimeAmount: roundMAD(totalOvertimeAmount),
    },
    explanation: {
      summary: `Montant estime des heures supplementaires: ${roundMAD(totalOvertimeAmount)} MAD.`,
      assumptions: [
        `Le taux horaire de base est derive du salaire mensuel / ${rules.monthlyReferenceHours} heures.`,
        "Chaque tranche horaire applique son coefficient legal (jour, nuit, repos/ferie de jour, repos/ferie de nuit).",
      ],
      formulas: [
        "Montant tranche = heures tranche x taux horaire base x coefficient.",
        "Total heures sup = somme des montants par tranche.",
      ],
      warnings: [
        "Les conventions internes peuvent prevoir des majorations plus favorables.",
        "Les heures declarees doivent etre justifiables (pointage/planning).",
      ],
      nextSteps: [
        "Comparer l'estimation avec le bulletin du mois concerne.",
        "Utiliser un modele de reclamation si ecart non justifie.",
      ],
    },
  };
}
