import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const cnssPensionInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  averageSalary: z.number().positive(),
  contributionDays: z.number().min(1).max(20000),
  retirementAge: z.number().min(50).max(70).default(60),
});

export type CnssPensionInput = z.infer<typeof cnssPensionInputSchema>;

export type CnssPensionResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    replacementRatePercent: number;
    estimatedMonthlyPension: number;
    estimatedAnnualPension: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateCnssPension(rawInput: CnssPensionInput): CnssPensionResult {
  const input = cnssPensionInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const eligible = input.contributionDays >= rules.pensionMinContributionDays;
  const steps = eligible
    ? Math.floor((input.contributionDays - rules.pensionMinContributionDays) / rules.pensionAccrualStepDays)
    : 0;
  const replacementRate = eligible
    ? Math.min(
        rules.pensionBaseReplacementRate + steps * rules.pensionIncrementPerStep,
        rules.pensionMaxReplacementRate,
      )
    : 0;
  const referenceSalaryForCalc = Math.min(input.averageSalary, rules.pensionReferenceSalaryCeiling);
  const ageFactor =
    input.retirementAge >= rules.pensionNormalRetirementAge
      ? 1
      : rules.pensionEarlyRetirementFactor;
  const estimatedMonthlyPension = referenceSalaryForCalc * replacementRate * ageFactor;
  const estimatedAnnualPension = estimatedMonthlyPension * 12;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      replacementRatePercent: roundMAD(replacementRate * 100),
      estimatedMonthlyPension: roundMAD(estimatedMonthlyPension),
      estimatedAnnualPension: roundMAD(estimatedAnnualPension),
    },
    explanation: {
      summary: `Pension mensuelle estimee: ${roundMAD(estimatedMonthlyPension)} MAD.`,
      assumptions: [
        `Seuil d'eligibilite CNSS: ${rules.pensionMinContributionDays} jours cotises.`,
        `Salaire de reference plafonne a ${roundMAD(rules.pensionReferenceSalaryCeiling)} MAD.`,
        `Taux de remplacement plafonne a ${roundMAD(rules.pensionMaxReplacementRate * 100)}%.`,
        input.retirementAge < rules.pensionNormalRetirementAge
          ? "Un facteur de reduction est applique pour depart anticipe."
          : "Aucune reduction d'age n'est appliquee.",
      ],
      formulas: [
        "Taux remplacement = base + increments par tranche de jours cotises (plafonne).",
        "Pension mensuelle = salaire moyen x taux remplacement x facteur age.",
      ],
      warnings: [
        !eligible
          ? "Droits non ouverts dans cette simulation (jours cotises insuffisants)."
          : "Le montant reel CNSS depend du releve de carriere certifie.",
        "Ce simulateur reste indicatif et ne remplace pas un releve CNSS officiel.",
      ],
      nextSteps: [
        "Comparer avec votre releve de carriere CNSS.",
        "Mettre a jour la simulation avec des salaires moyens plus precis.",
      ],
    },
  };
}
