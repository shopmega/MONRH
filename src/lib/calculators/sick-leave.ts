import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const sickLeaveInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  sickDays: z.number().min(1).max(365),
});

export type SickLeaveInput = z.infer<typeof sickLeaveInputSchema>;

export type SickLeaveResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    paidDaysByCnss: number;
    grossIncomeEquivalent: number;
    cnssCompensation: number;
    estimatedIncomeLoss: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateSickLeave(rawInput: SickLeaveInput): SickLeaveResult {
  const input = sickLeaveInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const dailySalary = input.monthlySalary / 26;
  const effectiveDays = Math.min(input.sickDays, rules.sickLeaveMaxCompensatedDays);
  const paidDaysByCnss = Math.max(0, effectiveDays - rules.sickLeaveWaitingDays);
  const grossIncomeEquivalent = dailySalary * input.sickDays;
  const cnssCompensation = dailySalary * paidDaysByCnss * rules.sickLeaveCnssCoverageRate;
  const estimatedIncomeLoss = grossIncomeEquivalent - cnssCompensation;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      paidDaysByCnss: roundMAD(paidDaysByCnss),
      grossIncomeEquivalent: roundMAD(grossIncomeEquivalent),
      cnssCompensation: roundMAD(cnssCompensation),
      estimatedIncomeLoss: roundMAD(estimatedIncomeLoss),
    },
    explanation: {
      summary: `Compensation maladie estimee: ${roundMAD(cnssCompensation)} MAD.`,
      assumptions: [
        "Un delai de carence est applique avant indemnisation.",
        `Le taux de couverture CNSS applique est ${roundMAD(rules.sickLeaveCnssCoverageRate * 100)}%.`,
      ],
      formulas: [
        "Jours indemnises = jours d'arret - delai de carence.",
        "Indemnisation = salaire journalier x jours indemnises x taux CNSS.",
      ],
      warnings: [
        `Le calcul CNSS est borne a ${rules.sickLeaveMaxCompensatedDays} jours indemnises par periode legale.`,
        "Le versement effectif depend des justificatifs medicaux et des delais administratifs.",
      ],
      nextSteps: [
        "Transmettre l'arret maladie dans les delais requis.",
        "Conserver les preuves de depot du dossier.",
      ],
    },
  };
}
