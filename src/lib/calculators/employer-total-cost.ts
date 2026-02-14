import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const employerTotalCostInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  grossSalary: z.number().positive(),
  insuranceRate: z.number().min(0).max(0.2).default(0.015),
});

export type EmployerTotalCostInput = z.infer<typeof employerTotalCostInputSchema>;

export type EmployerTotalCostResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    grossSalary: number;
    cnssEmployer: number;
    amoEmployer: number;
    insuranceEmployer: number;
    totalCostToCompany: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateEmployerTotalCost(
  rawInput: EmployerTotalCostInput,
): EmployerTotalCostResult {
  const input = employerTotalCostInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const contributableBase = Math.min(input.grossSalary, rules.cnssCeiling);
  const cnssEmployer = contributableBase * rules.cnssEmployerRate;
  const amoEmployer = input.grossSalary * rules.amoEmployerRate;
  const insuranceEmployer = input.grossSalary * input.insuranceRate;
  const totalCostToCompany =
    input.grossSalary + cnssEmployer + amoEmployer + insuranceEmployer;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      grossSalary: roundMAD(input.grossSalary),
      cnssEmployer: roundMAD(cnssEmployer),
      amoEmployer: roundMAD(amoEmployer),
      insuranceEmployer: roundMAD(insuranceEmployer),
      totalCostToCompany: roundMAD(totalCostToCompany),
    },
    explanation: {
      summary: `Le cout total employeur estime est ${roundMAD(totalCostToCompany)} MAD par mois.`,
      assumptions: [
        "CNSS employeur appliquee avec plafond de base contributive.",
        "AMO employeur calculee sur le brut mensuel.",
        "Un taux d'assurance employeur parametrable est applique.",
      ],
      formulas: [
        "CNSS employeur = min(brut, plafond CNSS) x taux employeur.",
        "AMO employeur = brut x taux AMO employeur.",
        "Cout total = brut + CNSS + AMO + assurance.",
      ],
      warnings: [
        "D'autres couts RH (transport, primes, mutuelle) peuvent s'ajouter.",
      ],
      nextSteps: [
        "Comparer plusieurs niveaux de brut pour projection budgetaire.",
        "Conserver la version legale de reference pour audit.",
      ],
    },
  };
}
