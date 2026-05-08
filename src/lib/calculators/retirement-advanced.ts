import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const retirementAdvancedInputSchema = z.object({
  currentAge: z.number().int().min(20).max(59),
  retirementAge: z.number().int().min(55).max(65).default(60),
  currentGross: z.number().positive(),
  annualRaisePercent: z.number().min(0).max(20).default(3),
  contributionMonths: z.number().int().min(0),
  calculationDate: z.string().date().default(getCurrentDateISO),
  desiredMonthlyPension: z.number().min(0).default(0), // for gap calculation
});

export type RetirementAdvancedInput = z.infer<typeof retirementAdvancedInputSchema>;

export type RetirementAdvancedResult = {
  currentAge: number;
  retirementAge: number;
  yearsToRetirement: number;
  totalContributionMonthsAtRetirement: number;
  averageCareerSalary: number;
  projectedPension: number;
  replacementRate: number;
  lastSalaryAtRetirement: number;
  gap: {
    vsLastSalary: number;
    vsDesiredPension: number;
  };
  earlyRetirementPenalty: number | null;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateRetirementAdvanced(raw: RetirementAdvancedInput): RetirementAdvancedResult {
  const input = retirementAdvancedInputSchema.parse(raw);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);

  const yearsToRetirement = input.retirementAge - input.currentAge;
  const futureWorkMonths = yearsToRetirement * 12;
  const totalContributionMonths = input.contributionMonths + futureWorkMonths;

  // Project last salary with annual raise
  const lastSalaryAtRetirement = roundMAD(
    input.currentGross * Math.pow(1 + input.annualRaisePercent / 100, yearsToRetirement),
  );

  // Average salary over career (geometric mean approximation: current * growth^(years/2))
  const averageCareerSalary = roundMAD(
    input.currentGross * Math.pow(1 + input.annualRaisePercent / 100, yearsToRetirement / 2),
  );

  // CNSS pension formula:
  // Base rate = 50% for 1320 days (min). Each additional step of 216 days adds 1%.
  // Max = 70%.
  const referenceSalary = Math.min(averageCareerSalary, rules.pensionReferenceSalaryCeiling);
  const qualifyingDays = totalContributionMonths * 26; // ~26 working days/month
  const minDays = rules.pensionMinContributionDays;
  const stepDays = rules.pensionAccrualStepDays;

  let replacementRate = 0;
  if (qualifyingDays >= minDays) {
    const steps = Math.floor((qualifyingDays - minDays) / stepDays);
    replacementRate = Math.min(
      rules.pensionBaseReplacementRate + steps * rules.pensionIncrementPerStep,
      rules.pensionMaxReplacementRate,
    );
  }

  // Early retirement penalty
  let earlyRetirementPenalty: number | null = null;
  if (input.retirementAge < rules.pensionNormalRetirementAge) {
    earlyRetirementPenalty = roundMAD((1 - rules.pensionEarlyRetirementFactor) * 100);
    replacementRate *= rules.pensionEarlyRetirementFactor;
  }

  const projectedPension = roundMAD(referenceSalary * replacementRate);

  return {
    currentAge: input.currentAge,
    retirementAge: input.retirementAge,
    yearsToRetirement,
    totalContributionMonthsAtRetirement: totalContributionMonths,
    averageCareerSalary,
    projectedPension,
    replacementRate: roundMAD(replacementRate * 100),
    lastSalaryAtRetirement,
    gap: {
      vsLastSalary: roundMAD(lastSalaryAtRetirement - projectedPension),
      vsDesiredPension: roundMAD(Math.max(0, input.desiredMonthlyPension - projectedPension)),
    },
    earlyRetirementPenalty,
    explanation: {
      summary: `A ${input.retirementAge} ans avec ${totalContributionMonths} mois de cotisations, votre pension estimee est ${projectedPension} MAD/mois (${roundMAD(replacementRate * 100)}% du salaire de reference).`,
      warnings: [
        qualifyingDays < minDays
          ? `Attention: vous n'aurez pas assez de jours cotises (${qualifyingDays} vs ${minDays} requis). Pension nulle.`
          : "",
        earlyRetirementPenalty !== null
          ? `Depart anticipe: penalite de ${earlyRetirementPenalty}% sur la pension.`
          : "",
        `Ecart vs dernier salaire: ${roundMAD(lastSalaryAtRetirement - projectedPension)} MAD/mois a combler.`,
      ].filter(Boolean) as string[],
      nextSteps: [
        "Verifiez votre releve de cotisations CNSS.",
        `Pour atteindre ${rules.pensionMaxReplacementRate * 100}% de remplacement, visez ${Math.ceil((minDays + (rules.pensionMaxReplacementRate - rules.pensionBaseReplacementRate) / rules.pensionIncrementPerStep * stepDays) / 26 / 12)} ans de cotisations.`,
        "Envisagez une epargne complementaire (CIMR, assurance vie) pour combler l'ecart.",
      ],
    },
  };
}
