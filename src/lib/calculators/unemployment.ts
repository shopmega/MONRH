import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const unemploymentInputSchema = z.object({
  monthlyGross: z.number().positive(),  // reference salary for CNSS
  contributionMonths: z.number().int().min(0), // total months contributed to CNSS
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlyExpenses: z.number().min(0).default(0), // for financial runway calculation
});

export type UnemploymentInput = z.infer<typeof unemploymentInputSchema>;

export type UnemploymentResult = {
  calculationDate: string;
  referenceSalary: number;
  eligible: boolean;
  eligibilityReason: string;
  monthly: {
    cnssIndemnity: number;
    durationMonths: number;
  };
  financialRunway: {
    monthlyExpenses: number;
    monthsCovered: number;
    gap: number; // monthly shortfall vs expenses
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── CNSS Unemployment rules (Morocco) ────────────────────────────────────────
// Based on Loi 03-03 (2004) and updates:
// - Minimum 780 days (26 months) of contributions in last 36 months
// - Benefit = 70% of refence salary (capped at national ceiling)
// - Duration: 6 months for 24-36 months contributions, up to 36 months for long careers

function computeUnemploymentBenefit(
  monthlyGross: number,
  contributionMonths: number,
  pReferenceSalaryCeiling: number,
): { eligible: boolean; reason: string; monthlyBenefit: number; durationMonths: number } {
  // Minimum requirement: ~780 days = 26 months in the last 36 months
  const MIN_MONTHS = 26;
  if (contributionMonths < MIN_MONTHS) {
    return {
      eligible: false,
      reason: `Un minimum de ${MIN_MONTHS} mois de cotisations est requis. Vous en avez ${contributionMonths}.`,
      monthlyBenefit: 0,
      durationMonths: 0,
    };
  }

  const referenceSalary = Math.min(monthlyGross, pReferenceSalaryCeiling);
  const monthlyBenefit = roundMAD(referenceSalary * 0.7);

  // Duration table (simplified):
  // 26-35 months → 6 months indemnity
  // 36-59 months → 12 months
  // 60-119 months → 18 months
  // 120+ months   → 36 months
  let durationMonths: number;
  if (contributionMonths < 36) durationMonths = 6;
  else if (contributionMonths < 60) durationMonths = 12;
  else if (contributionMonths < 120) durationMonths = 18;
  else durationMonths = 36;

  return {
    eligible: true,
    reason: `Eligible. ${contributionMonths} mois de cotisations — prestation de ${durationMonths} mois.`,
    monthlyBenefit,
    durationMonths,
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateUnemployment(raw: UnemploymentInput): UnemploymentResult {
  const input = unemploymentInputSchema.parse(raw);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const ceiling = rules.pensionReferenceSalaryCeiling;

  const benefit = computeUnemploymentBenefit(input.monthlyGross, input.contributionMonths, ceiling);

  const monthsCovered = benefit.eligible && input.monthlyExpenses > 0
    ? roundMAD((benefit.monthlyBenefit * benefit.durationMonths) / input.monthlyExpenses)
    : benefit.durationMonths;
  const gap = benefit.eligible
    ? roundMAD(Math.max(0, input.monthlyExpenses - benefit.monthlyBenefit))
    : input.monthlyExpenses;

  return {
    calculationDate: input.calculationDate,
    referenceSalary: roundMAD(Math.min(input.monthlyGross, ceiling)),
    eligible: benefit.eligible,
    eligibilityReason: benefit.reason,
    monthly: {
      cnssIndemnity: benefit.monthlyBenefit,
      durationMonths: benefit.durationMonths,
    },
    financialRunway: {
      monthlyExpenses: roundMAD(input.monthlyExpenses),
      monthsCovered: benefit.eligible ? Math.min(monthsCovered, benefit.durationMonths) : 0,
      gap,
    },
    explanation: {
      summary: benefit.eligible
        ? `Vous etes eligible a ${benefit.monthlyBenefit} MAD/mois pendant ${benefit.durationMonths} mois.`
        : `Non eligible: ${benefit.reason}`,
      warnings: [
        "L'indemnite CNSS est plafonnee au salaire de reference CNSS.",
        "La demande doit etre deposee dans les 60 jours suivant la perte d'emploi.",
        gap > 0 && benefit.eligible
          ? `Ecart mensuel de ${gap} MAD entre l'indemnite et vos charges estimees.`
          : "",
      ].filter(Boolean) as string[],
      nextSteps: [
        "Deposez votre dossier CNSS (formulaire D-307) dans les 60 jours.",
        "Constituez: bulletin de salaire, attestation CNSS, lettre de licenciement.",
        "Elaborez un plan de survie financiere pour la duree de l'indemnisation.",
      ],
    },
  };
}
