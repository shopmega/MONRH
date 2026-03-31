import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const seniorityGrowthInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  currentYears: z.number().min(0).max(60),
  additionalYears: z.number().min(0).max(20),
});

export type SeniorityGrowthInput = z.infer<typeof seniorityGrowthInputSchema>;

export type SeniorityGrowthResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    currentIndemnityEstimate: number;
    futureIndemnityEstimate: number;
    growthAmount: number;
    growthPercent: number;
  };
  explanation: CalculatorExplanation;
};

function indemnityHoursForYears(
  years: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
) {
  const tranche1 = Math.min(years, 5);
  const tranche2 = Math.min(Math.max(years - 5, 0), 5);
  const tranche3 = Math.min(Math.max(years - 10, 0), 5);
  const tranche4 = Math.max(years - 15, 0);
  return (
    tranche1 * rules.tranche1HoursPerYear +
    tranche2 * rules.tranche2HoursPerYear +
    tranche3 * rules.tranche3HoursPerYear +
    tranche4 * rules.tranche4HoursPerYear
  );
}

export function simulateSeniorityGrowth(
  rawInput: SeniorityGrowthInput,
): SeniorityGrowthResult {
  const input = seniorityGrowthInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const hourlySalary = input.monthlySalary / 191;
  const currentIndemnityEstimate =
    hourlySalary * indemnityHoursForYears(input.currentYears, rules);
  const futureIndemnityEstimate =
    hourlySalary * indemnityHoursForYears(input.currentYears + input.additionalYears, rules);
  const growthAmount = futureIndemnityEstimate - currentIndemnityEstimate;
  const growthPercent =
    currentIndemnityEstimate > 0
      ? (growthAmount / currentIndemnityEstimate) * 100
      : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      currentIndemnityEstimate: roundMAD(currentIndemnityEstimate),
      futureIndemnityEstimate: roundMAD(futureIndemnityEstimate),
      growthAmount: roundMAD(growthAmount),
      growthPercent: roundMAD(growthPercent),
    },
    explanation: {
      summary: `Rester ${input.additionalYears} an(s) de plus peut augmenter l'indemnite d'environ ${roundMAD(growthAmount)} MAD.`,
      assumptions: [
        "Le salaire mensuel est suppose constant sur la periode comparee.",
        "Les regles d'indemnite legale restent celles de la version choisie.",
      ],
      formulas: [
        "Indemnite = salaire horaire x heures dues selon anciennete.",
        "Croissance = indemnite future - indemnite actuelle.",
      ],
      warnings: [
        "Les revalorisations salariales futures peuvent modifier fortement le resultat.",
      ],
      nextSteps: [
        "Tester plusieurs hypotheses de salaire pour scenario planning.",
        "Comparer ce gain potentiel avec votre plan de mobilite professionnelle.",
      ],
    },
  };
}
