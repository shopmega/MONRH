import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const workAccidentInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  temporaryIncapacityDays: z.number().min(0).max(365).default(0),
  permanentIncapacityPercent: z.number().min(0).max(100).default(0),
});

export type WorkAccidentInput = z.infer<typeof workAccidentInputSchema>;

export type WorkAccidentResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    temporaryCompensation: number;
    monthlyPermanentCompensation: number;
    annualPermanentCompensation: number;
    totalFirstYearEstimate: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateWorkAccident(rawInput: WorkAccidentInput): WorkAccidentResult {
  const input = workAccidentInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const dailySalary = input.monthlySalary / 26;
  const temporaryCompensation =
    dailySalary * input.temporaryIncapacityDays * rules.workAccidentTemporaryCoverageRate;
  const monthlyPermanentCompensation =
    input.monthlySalary *
    (input.permanentIncapacityPercent / 100) *
    rules.workAccidentPermanentCoverageCoefficient;
  const annualPermanentCompensation = monthlyPermanentCompensation * 12;
  const totalFirstYearEstimate = temporaryCompensation + annualPermanentCompensation;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      temporaryCompensation: roundMAD(temporaryCompensation),
      monthlyPermanentCompensation: roundMAD(monthlyPermanentCompensation),
      annualPermanentCompensation: roundMAD(annualPermanentCompensation),
      totalFirstYearEstimate: roundMAD(totalFirstYearEstimate),
    },
    explanation: {
      summary: `Indemnisation premiere annee estimee: ${roundMAD(totalFirstYearEstimate)} MAD.`,
      assumptions: [
        "Incapacite temporaire indemnisee sur base partielle du salaire journalier.",
        "Incapacite permanente estimee en rente proportionnelle au taux d'incapacite.",
      ],
      formulas: [
        "Temporaire = salaire journalier x jours d'arret x taux couverture.",
        "Rente mensuelle = salaire mensuel x taux incapacite x coefficient simplifie.",
      ],
      warnings: [
        "Le bareme medico-legal reel peut differer selon expertise.",
        "Le calcul reste une estimation simplifiee et ne remplace pas l'expertise assureur/CNSS.",
      ],
      nextSteps: [
        "Constituer dossier complet: certificat medical, declaration accident, preuves.",
        "Verifier la notification officielle du taux d'incapacite.",
      ],
    },
  };
}
