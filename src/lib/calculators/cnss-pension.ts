import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const cnssPensionInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  /** Average salary for the last 5 years (reference base) */
  averageSalary: z.number().positive(),
  contributionDays: z.number().min(1).max(20000),
  retirementAge: z.number().min(50).max(70).default(60),
  /** Optional annual salary growth rate to project future pension basis */
  salaryGrowthRatePercent: z.number().min(0).max(20).default(0),
  /** Additional projected years of contribution before retirement */
  additionalContributionYears: z.number().min(0).max(30).default(0),
  /** Whether the employee also contributes to CIMR (private pension) */
  hasCimr: z.boolean().default(false),
  /** CIMR monthly pension estimate if known */
  cimrMonthlyEstimate: z.number().min(0).default(0),
});

export type CnssPensionInput = z.infer<typeof cnssPensionInputSchema>;

export type CnssPensionResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    cnssEligible: boolean;
    projectedContributionDays: number;
    projectedAverageSalary: number;
    replacementRatePercent: number;
    estimatedMonthlyPensionCnss: number;
    estimatedAnnualPensionCnss: number;
    cimrMonthlyEstimate: number;
    combinedMonthlyEstimate: number;
    replacementRateCombinedPercent: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateCnssPension(rawInput: CnssPensionInput): CnssPensionResult {
  const input = cnssPensionInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);

  // Project salary forward with growth rate
  const yearsGrowth = input.additionalContributionYears;
  const projectedAverageSalary =
    yearsGrowth > 0 && input.salaryGrowthRatePercent > 0
      ? roundMAD(input.averageSalary * Math.pow(1 + input.salaryGrowthRatePercent / 100, yearsGrowth))
      : input.averageSalary;

  // Project contribution days with additional working years (260 working days/year)
  const projectedContributionDays = Math.min(
    input.contributionDays + input.additionalContributionYears * 260,
    20000,
  );

  const cnssEligible = projectedContributionDays >= rules.pensionMinContributionDays;
  const steps = cnssEligible
    ? Math.floor((projectedContributionDays - rules.pensionMinContributionDays) / rules.pensionAccrualStepDays)
    : 0;

  const replacementRate = cnssEligible
    ? Math.min(
      rules.pensionBaseReplacementRate + steps * rules.pensionIncrementPerStep,
      rules.pensionMaxReplacementRate,
    )
    : 0;

  const referenceSalary = Math.min(projectedAverageSalary, rules.pensionReferenceSalaryCeiling);

  const ageFactor =
    input.retirementAge >= rules.pensionNormalRetirementAge
      ? 1
      : rules.pensionEarlyRetirementFactor;

  const estimatedMonthlyPensionCnss = roundMAD(referenceSalary * replacementRate * ageFactor);
  const estimatedAnnualPensionCnss = roundMAD(estimatedMonthlyPensionCnss * 12);

  const combinedMonthlyEstimate = roundMAD(estimatedMonthlyPensionCnss + (input.hasCimr ? input.cimrMonthlyEstimate : 0));
  const replacementRateCombinedPercent =
    projectedAverageSalary > 0
      ? roundMAD((combinedMonthlyEstimate / projectedAverageSalary) * 100)
      : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      cnssEligible,
      projectedContributionDays,
      projectedAverageSalary,
      replacementRatePercent: roundMAD(replacementRate * 100),
      estimatedMonthlyPensionCnss,
      estimatedAnnualPensionCnss,
      cimrMonthlyEstimate: input.hasCimr ? roundMAD(input.cimrMonthlyEstimate) : 0,
      combinedMonthlyEstimate,
      replacementRateCombinedPercent,
    },
    explanation: {
      summary: cnssEligible
        ? `Pension CNSS mensuelle estimee: ${estimatedMonthlyPensionCnss} MAD${input.hasCimr ? ` + CIMR: ${roundMAD(input.cimrMonthlyEstimate)} MAD = ${combinedMonthlyEstimate} MAD combinee.` : "."}`
        : `Droits CNSS non ouverts: ${projectedContributionDays} jours cotises sur ${rules.pensionMinContributionDays} requis.`,
      assumptions: [
        `Seuil minimum: ${rules.pensionMinContributionDays} jours cotises (acquis: ${projectedContributionDays}).`,
        `Plafond salaire de reference: ${rules.pensionReferenceSalaryCeiling} MAD/mois.`,
        `Taux de remplacement: base ${roundMAD(rules.pensionBaseReplacementRate * 100)}% + ${roundMAD(rules.pensionIncrementPerStep * 100)}% par tranche de ${rules.pensionAccrualStepDays} jours (max ${roundMAD(rules.pensionMaxReplacementRate * 100)}%).`,
        input.additionalContributionYears > 0
          ? `Projection sur ${input.additionalContributionYears} annees supplementaires a ${input.salaryGrowthRatePercent}%/an.`
          : "Simulation sur la base de cotisations actuelles.",
        input.retirementAge < rules.pensionNormalRetirementAge
          ? `Depart anticipe (${input.retirementAge} ans < ${rules.pensionNormalRetirementAge} ans): coefficient reduction ${rules.pensionEarlyRetirementFactor}.`
          : "Depart a l'age normal: aucune reduction appliquee.",
      ],
      formulas: [
        "Taux remplacement = base + increments par tranche (plafonne).",
        "Pension CNSS = min(salaire, plafond) x taux remplacement x facteur age.",
        "Pension combinee = CNSS + CIMR (si applicable).",
        "Taux remplacement global = pension combinee / salaire projete.",
      ],
      warnings: [
        !cnssEligible
          ? `Jours insuffisants: ${projectedContributionDays}/${rules.pensionMinContributionDays} — aucun droit ouvert.`
          : `Pour atteindre le taux maximum (${roundMAD(rules.pensionMaxReplacementRate * 100)}%), il faut: ${rules.pensionMinContributionDays + Math.ceil((rules.pensionMaxReplacementRate - rules.pensionBaseReplacementRate) / rules.pensionIncrementPerStep) * rules.pensionAccrualStepDays} jours cotises.`,
        "Le montant reel depend du releve de carriere CNSS certifie.",
        "Ce simulateur reste indicatif et ne remplace pas un releve officiel CNSS.",
      ],
      nextSteps: [
        "Recuperer votre releve de carriere CNSS (en ligne ou agence).",
        "Mettre a jour le salaire moyen avec les 5 dernieres annees.",
        "Comparer la projection avec et sans CIMR pour evaluer le gap.",
        replacementRateCombinedPercent < 50 ? "Envisager une epargne complementaire: le taux de remplacement projete est faible." : "",
      ].filter(Boolean),
    },
  };
}
