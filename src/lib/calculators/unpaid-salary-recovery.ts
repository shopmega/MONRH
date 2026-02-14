import { z } from "zod";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const unpaidSalaryRecoveryInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  unpaidMonths: z.number().min(1).max(36),
  delayMonths: z.number().min(0).max(60).default(0),
  penaltyRatePerMonth: z.number().min(0).max(0.05).default(0.01),
});

export type UnpaidSalaryRecoveryInput = z.infer<typeof unpaidSalaryRecoveryInputSchema>;

export type UnpaidSalaryRecoveryResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    principalAmount: number;
    delayPenalties: number;
    totalClaimAmount: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateUnpaidSalaryRecovery(
  rawInput: UnpaidSalaryRecoveryInput,
): UnpaidSalaryRecoveryResult {
  const input = unpaidSalaryRecoveryInputSchema.parse(rawInput);
  const rules = getSmigRulesByDate(input.calculationDate);
  const principalAmount = input.monthlySalary * input.unpaidMonths;
  const delayPenalties =
    principalAmount * input.penaltyRatePerMonth * input.delayMonths;
  const totalClaimAmount = principalAmount + delayPenalties;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      principalAmount: roundMAD(principalAmount),
      delayPenalties: roundMAD(delayPenalties),
      totalClaimAmount: roundMAD(totalClaimAmount),
    },
    explanation: {
      summary: `Montant total de reclamation estime: ${roundMAD(totalClaimAmount)} MAD.`,
      assumptions: [
        "Penalites calculees avec un taux mensuel constant saisi par l'utilisateur.",
        "Le principal correspond au cumul des mois non regles.",
      ],
      formulas: [
        "Principal = salaire mensuel x mois impayes.",
        "Penalites = principal x taux mensuel x mois de retard.",
      ],
      warnings: [
        "Le taux de penalite legalement retenu peut differer selon dossier.",
      ],
      nextSteps: [
        "Envoyer une mise en demeure ecrite avec detail des montants.",
        "Conserver bulletins, contrat et preuves de non-paiement.",
      ],
    },
  };
}
