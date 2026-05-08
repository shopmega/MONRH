import { z } from "zod";
import { getOvertimeRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const publicHolidayCompensationInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  holidayHoursWorked: z.number().min(0).max(200),
  alreadyPaidNormalDay: z.boolean().default(true),
});

export type PublicHolidayCompensationInput = z.infer<
  typeof publicHolidayCompensationInputSchema
>;

export type PublicHolidayCompensationResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    baseHourlyRate: number;
    multiplierApplied: number;
    compensationAmount: number;
  };
  explanation: CalculatorExplanation;
};

export function simulatePublicHolidayCompensation(
  rawInput: PublicHolidayCompensationInput,
): PublicHolidayCompensationResult {
  const input = publicHolidayCompensationInputSchema.parse(rawInput);
  const rules = getOvertimeRulesByDate(input.calculationDate);
  const baseHourlyRate = input.monthlySalary / rules.monthlyReferenceHours;
  const holidayDaytimeMultiplier = rules.restOrHolidayDaytimeMultiplier ?? rules.weekendMultiplier;
  const multiplierApplied = input.alreadyPaidNormalDay ? holidayDaytimeMultiplier : 1 + holidayDaytimeMultiplier;
  const compensationAmount =
    input.holidayHoursWorked * baseHourlyRate * multiplierApplied;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      baseHourlyRate: roundMAD(baseHourlyRate),
      multiplierApplied: roundMAD(multiplierApplied),
      compensationAmount: roundMAD(compensationAmount),
    },
    explanation: {
      summary: `Compensation estimee pour travail jour ferie: ${roundMAD(compensationAmount)} MAD.`,
      assumptions: [
        "Le taux horaire de base est derive du salaire mensuel / 191 heures.",
        input.alreadyPaidNormalDay
          ? "Jour normal considere deja remunere."
          : "Jour normal non remunere, majoration plus elevee appliquee.",
      ],
      formulas: [
        "Compensation = heures feriees x taux horaire x coefficient ferie.",
      ],
      warnings: [
        "Les conventions internes peuvent prevoir des regles plus favorables.",
      ],
      nextSteps: [
        "Verifier les heures exactes sur planning et pointage.",
        "Comparer avec la ligne heures feries du bulletin de paie.",
      ],
    },
  };
}
