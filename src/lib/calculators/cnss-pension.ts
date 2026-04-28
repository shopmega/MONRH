import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const cnssPensionInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  /** Average salary for the last 5 years (reference base) */
  averageSalary: z.number().positive(),
  contributionDays: z.number().min(1).max(20000),
  birthDate: z.string().date().optional(),
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

export type CnssPensionInput = z.input<typeof cnssPensionInputSchema>;

export type CnssPensionResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    cnssEligible: boolean;
    projectedContributionDays: number;
    openingContributionDaysRequired: number;
    fullFormulaContributionDaysRequired: number;
    projectedRetirementAge: number;
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
  const openingContributionDays = rules.pensionOpeningContributionDays ?? rules.pensionMinContributionDays;
  const fullFormulaContributionDays = rules.pensionFullContributionDays ?? rules.pensionMinContributionDays;

  const yearsGrowth = input.additionalContributionYears;
  const projectedAverageSalary =
    yearsGrowth > 0 && input.salaryGrowthRatePercent > 0
      ? roundMAD(input.averageSalary * Math.pow(1 + input.salaryGrowthRatePercent / 100, yearsGrowth))
      : input.averageSalary;

  const projectedContributionDays = Math.min(
    input.contributionDays + input.additionalContributionYears * 260,
    20000,
  );

  const birthDateAge = input.birthDate
    ? new Date(input.calculationDate).getFullYear() - new Date(input.birthDate).getFullYear()
    : null;
  const projectedRetirementAge = birthDateAge !== null
    ? Math.max(0, birthDateAge + input.additionalContributionYears)
    : input.retirementAge;

  const cnssEligible = projectedContributionDays >= openingContributionDays;
  const steps = cnssEligible
    ? Math.floor(Math.max(projectedContributionDays - fullFormulaContributionDays, 0) / rules.pensionAccrualStepDays)
    : 0;

  const replacementRate = !cnssEligible
    ? 0
    : projectedContributionDays < fullFormulaContributionDays
      ? rules.pensionBaseReplacementRate * (projectedContributionDays / fullFormulaContributionDays)
      : Math.min(
        rules.pensionBaseReplacementRate + steps * rules.pensionIncrementPerStep,
        rules.pensionMaxReplacementRate,
      );

  const referenceSalary = Math.min(projectedAverageSalary, rules.pensionReferenceSalaryCeiling);
  const ageFactor =
    projectedRetirementAge >= rules.pensionNormalRetirementAge
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
      openingContributionDaysRequired: openingContributionDays,
      fullFormulaContributionDaysRequired: fullFormulaContributionDays,
      projectedRetirementAge,
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
        : `Droits CNSS non ouverts: ${projectedContributionDays} jours cotises sur ${openingContributionDays} requis.`,
      assumptions: [
        `Seuil d'ouverture: ${openingContributionDays} jours cotises (acquis: ${projectedContributionDays}).`,
        `Base formule pleine: ${fullFormulaContributionDays} jours cotises.`,
        `Age projete retenu: ${projectedRetirementAge} ans (age normal CNSS: ${rules.pensionNormalRetirementAge} ans).`,
        `Plafond salaire de reference: ${rules.pensionReferenceSalaryCeiling} MAD/mois.`,
        `Taux de remplacement: base ${roundMAD(rules.pensionBaseReplacementRate * 100)}% + ${roundMAD(rules.pensionIncrementPerStep * 100)}% par tranche de ${rules.pensionAccrualStepDays} jours (max ${roundMAD(rules.pensionMaxReplacementRate * 100)}%).`,
        input.additionalContributionYears > 0
          ? `Projection sur ${input.additionalContributionYears} annees supplementaires a ${input.salaryGrowthRatePercent}%/an.`
          : "Simulation sur la base de cotisations actuelles.",
        projectedRetirementAge < rules.pensionNormalRetirementAge
          ? `Depart anticipe (${projectedRetirementAge} ans < ${rules.pensionNormalRetirementAge} ans): coefficient reduction ${rules.pensionEarlyRetirementFactor}.`
          : "Depart a l'age normal: aucune reduction appliquee.",
      ],
      formulas: [
        "Taux remplacement = prorata avant la base pleine, puis base + increments par tranche (plafonne).",
        "Pension CNSS = min(salaire, plafond) x taux remplacement x facteur age.",
        "Pension combinee = CNSS + CIMR (si applicable).",
        "Taux remplacement global = pension combinee / salaire projete.",
      ],
      warnings: [
        !cnssEligible
          ? `Jours insuffisants: ${projectedContributionDays}/${openingContributionDays} - aucun droit ouvert.`
          : `Pour atteindre le taux maximum (${roundMAD(rules.pensionMaxReplacementRate * 100)}%), il faut: ${fullFormulaContributionDays + Math.ceil((rules.pensionMaxReplacementRate - rules.pensionBaseReplacementRate) / rules.pensionIncrementPerStep) * rules.pensionAccrualStepDays} jours cotises.`,
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
