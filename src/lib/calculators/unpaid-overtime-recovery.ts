import { z } from "zod";
import { getOvertimeRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const unpaidOvertimeRecoveryInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  periodStartDate: z.string().date().optional(),
  periodEndDate: z.string().date().optional(),
  monthlySalary: z.number().positive(),
  unpaidDayHours: z.number().min(0).max(500).default(0),
  unpaidNightHours: z.number().min(0).max(500).default(0),
  unpaidWeekendHours: z.number().min(0).max(500).default(0),
  unpaidHolidayHours: z.number().min(0).max(500).default(0),
  delayMonths: z.number().min(0).max(60).default(0),
  penaltyRatePerMonth: z.number().min(0).max(0.05).optional(),
  contractualPenaltyRatePerMonth: z.number().min(0).max(0.05).default(0),
  hasTimesheets: z.boolean().default(false),
  hasManagerApproval: z.boolean().default(false),
});

export type UnpaidOvertimeRecoveryInput = z.input<
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
    input.unpaidDayHours * hourly * (rules.normalDayDaytimeMultiplier ?? rules.dayMultiplier) +
    input.unpaidNightHours * hourly * (rules.normalDayNightMultiplier ?? rules.nightMultiplier) +
    input.unpaidWeekendHours * hourly * (rules.restOrHolidayDaytimeMultiplier ?? rules.weekendMultiplier) +
    input.unpaidHolidayHours * hourly * (rules.restOrHolidayNightMultiplier ?? rules.holidayMultiplier);
  const explicitPenaltyRate = input.contractualPenaltyRatePerMonth || input.penaltyRatePerMonth || 0;
  const delayPenalties =
    overtimePrincipal * explicitPenaltyRate * input.delayMonths;
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
        explicitPenaltyRate > 0
          ? "Penalite de retard appliquee uniquement parce qu'un taux contractuel/judiciaire explicite est fourni."
          : "Aucune penalite de retard ajoutee faute de taux contractuel ou judiciaire explicite.",
        input.periodStartDate && input.periodEndDate
          ? `Periode documentee: ${input.periodStartDate} au ${input.periodEndDate}.`
          : "Periode detaillee non fournie: utiliser des dates de debut/fin pour rendre le calcul auditables.",
      ],
      formulas: [
        "Principal = somme(heures impayees x taux horaire x coefficient).",
        "Penalites = principal x taux mensuel x mois de retard, uniquement si un taux explicite est fourni.",
      ],
      warnings: [
        !input.hasTimesheets
          ? "Pointages absents: les heures declarees doivent etre documentees par planning, badgeage ou tableau detaille."
          : "Pointages declares disponibles.",
        !input.hasManagerApproval
          ? "Validation manager non declaree: le risque probatoire augmente si les heures n'ont pas ete autorisees ou connues par l'employeur."
          : "Validation manager declaree disponible.",
      ],
      nextSteps: [
        "Constituer tableau detaille par jour et type d'heures.",
        "Joindre les preuves a la reclamation employeur ou inspection.",
      ],
    },
  };
}
