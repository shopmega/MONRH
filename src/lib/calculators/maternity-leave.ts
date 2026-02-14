import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const maternityLeaveInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  leaveWeeks: z.number().min(1).max(52).default(14),
  employerTopUp: z.boolean().default(false),
});

export type MaternityLeaveInput = z.infer<typeof maternityLeaveInputSchema>;

export type MaternityLeaveResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    leaveMonthsEquivalent: number;
    cnssCompensation: number;
    employerTopUpAmount: number;
    totalEstimatedIncome: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateMaternityLeave(
  rawInput: MaternityLeaveInput,
): MaternityLeaveResult {
  const input = maternityLeaveInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const coveredWeeksByCnss = Math.min(input.leaveWeeks, rules.maternityLegalLeaveWeeks);
  const leaveMonthsEquivalent = input.leaveWeeks / 4.33;
  const coveredMonthsByCnss = coveredWeeksByCnss / 4.33;
  const fullEquivalentIncome = input.monthlySalary * leaveMonthsEquivalent;
  const cnssCompensation = input.monthlySalary * coveredMonthsByCnss * rules.maternityCnssCoverageRate;
  const employerTopUpAmount = input.employerTopUp
    ? fullEquivalentIncome - cnssCompensation
    : 0;
  const totalEstimatedIncome = cnssCompensation + employerTopUpAmount;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      leaveMonthsEquivalent: roundMAD(leaveMonthsEquivalent),
      cnssCompensation: roundMAD(cnssCompensation),
      employerTopUpAmount: roundMAD(employerTopUpAmount),
      totalEstimatedIncome: roundMAD(totalEstimatedIncome),
    },
    explanation: {
      summary: `Revenu estime pendant conge maternite: ${roundMAD(totalEstimatedIncome)} MAD.`,
      assumptions: [
        "La duree est convertie en equivalent mois (semaines / 4.33).",
        `Taux CNSS applique: ${roundMAD(rules.maternityCnssCoverageRate * 100)}%.`,
        `La couverture CNSS est plafonnee a ${rules.maternityLegalLeaveWeeks} semaines legale.`,
        input.employerTopUp
          ? "Complement employeur active pour atteindre l'equivalent plein."
          : "Aucun complement employeur n'est applique.",
      ],
      formulas: [
        "CNSS = revenu theorique sur la periode x taux de couverture.",
        "Total = CNSS + complement employeur (si applicable).",
      ],
      warnings: [
        "Les conditions d'ouverture des droits CNSS doivent etre verifiees.",
      ],
      nextSteps: [
        "Preparer les justificatifs medicaux et administratifs.",
        "Confirmer le mode de traitement RH avant debut du conge.",
      ],
    },
  };
}
