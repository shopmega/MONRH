import { z } from "zod";
import { getOvertimeRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const unpaidOvertimeRecoveryInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  unpaidDayHours: z.number().min(0).max(500).default(0),
  unpaidNightHours: z.number().min(0).max(500).default(0),
  unpaidWeekendHours: z.number().min(0).max(500).default(0),
  unpaidHolidayHours: z.number().min(0).max(500).default(0),
  delayMonths: z.number().min(0).max(60).default(0),
  penaltyRatePerMonth: z.number().min(0).max(0.05).default(0.01),
});

export type UnpaidOvertimeRecoveryInput = z.infer<
  typeof unpaidOvertimeRecoveryInputSchema
>;

export type UnpaidOvertimeRecoveryResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    overtimePrincipal: number;
    delayPenalties: number;
    totalClaimAmount: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateUnpaidOvertimeRecovery(
  rawInput: UnpaidOvertimeRecoveryInput,
): UnpaidOvertimeRecoveryResult {
  const input = unpaidOvertimeRecoveryInputSchema.parse(rawInput);
  const rules = getOvertimeRulesByDate(input.calculationDate);
  const hourly = input.monthlySalary / rules.monthlyReferenceHours;
  const overtimePrincipal =
    input.unpaidDayHours * hourly * rules.dayMultiplier +
    input.unpaidNightHours * hourly * rules.nightMultiplier +
    input.unpaidWeekendHours * hourly * rules.weekendMultiplier +
    input.unpaidHolidayHours * hourly * rules.holidayMultiplier;
  const delayPenalties =
    overtimePrincipal * input.penaltyRatePerMonth * input.delayMonths;
  const totalClaimAmount = overtimePrincipal + delayPenalties;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      overtimePrincipal: roundMAD(overtimePrincipal),
      delayPenalties: roundMAD(delayPenalties),
      totalClaimAmount: roundMAD(totalClaimAmount),
    },
    explanation: {
      summary: `Montant estime de recuperation heures sup: ${roundMAD(totalClaimAmount)} MAD.`,
      assumptions: [
        "Chaque type d'heure applique son coefficient legal de majoration.",
        "Penalite de retard appliquee sur le principal estime.",
      ],
      formulas: [
        "Principal = somme(heures impayees x taux horaire x coefficient).",
        "Penalites = principal x taux mensuel x mois de retard.",
      ],
      warnings: [
        "Les heures declarees doivent etre documentees (pointage/planning).",
      ],
      nextSteps: [
        "Constituer tableau detaille par jour et type d'heures.",
        "Joindre les preuves a la reclamation employeur ou inspection.",
      ],
    },
  };
}
