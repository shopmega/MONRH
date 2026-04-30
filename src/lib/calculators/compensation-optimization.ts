import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { computeMonthlyPayrollFromGross, roundMAD } from "@/lib/calculators/payroll-core";

export const compensationOptimizationInputSchema = z.object({
  totalBudget: z.number().positive(),
  calculationDate: z.string().date().default(getCurrentDateISO),
  salaryOnlyGross: z.number().positive(),
  salaryWithBonusGross: z.number().positive(),
  annualBonusGross: z.number().min(0).default(0),
  salaryWithBenefitsGross: z.number().positive(),
  benefitsMonthlyValue: z.number().min(0).default(0),
});

export type CompensationOptimizationInput = z.infer<typeof compensationOptimizationInputSchema>;

export type CompensationScenario = {
  label: string;
  gross: number;
  netMonthly: number;
  netAnnual: number;
  employerCost: number;
  incomeTax: number;
  taxEfficiency: number;
};

export type CompensationOptimizationResult = {
  scenarios: CompensationScenario[];
  bestNetScenario: string;
  bestEfficiencyScenario: string;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

export function simulateCompensationOptimization(raw: CompensationOptimizationInput): CompensationOptimizationResult {
  const input = compensationOptimizationInputSchema.parse(raw);

  const scenarios: CompensationScenario[] = [
    buildScenario("Salaire pur", input.salaryOnlyGross, input.calculationDate),
    buildScenario(
      "Salaire + Prime mensuelle",
      input.salaryWithBonusGross + input.annualBonusGross / 12,
      input.calculationDate,
    ),
    buildScenario(
      "Salaire + Avantages",
      input.salaryWithBenefitsGross + input.benefitsMonthlyValue,
      input.calculationDate,
    ),
  ];

  const bestNet = scenarios.reduce((best, scenario) => (scenario.netMonthly > best.netMonthly ? scenario : best));
  const bestEfficiency = scenarios.reduce((best, scenario) =>
    scenario.taxEfficiency > best.taxEfficiency ? scenario : best,
  );
  const overBudget = scenarios.filter((scenario) => scenario.employerCost > input.totalBudget);

  return {
    scenarios,
    bestNetScenario: bestNet.label,
    bestEfficiencyScenario: bestEfficiency.label,
    explanation: {
      summary: `Sur un budget employeur cible de ${input.totalBudget} MAD, le meilleur net est ${bestNet.label} (${bestNet.netMonthly} MAD/mois). Meilleure efficacite fiscale: ${bestEfficiency.label} (${bestEfficiency.taxEfficiency}% du brut conserve).`,
      warnings: [
        "Les avantages en nature sont taxables sauf qualification/exoneration documentee.",
        "Comparez aussi le cout total employeur: une prime peut couter plus a l'employeur.",
        overBudget.length > 0
          ? `${overBudget.length} scenario(s) depassent le budget employeur declare.`
          : "Tous les scenarios restent dans le budget employeur declare.",
      ],
      nextSteps: [
        "Documenter le statut taxable ou exonere de chaque avantage avant arbitrage.",
        "Comparer les scenarios avec une fiche de paie reelle du meme mois.",
      ],
    },
  };
}

function buildScenario(label: string, gross: number, calculationDate: string): CompensationScenario {
  const payroll = computeMonthlyPayrollFromGross(gross, { calculationDate });
  return {
    label,
    gross: payroll.gross,
    netMonthly: payroll.net,
    netAnnual: roundMAD(payroll.net * 12),
    employerCost: payroll.employerTotalCost,
    incomeTax: payroll.incomeTax,
    taxEfficiency: roundMAD((payroll.net / payroll.gross) * 100),
  };
}
