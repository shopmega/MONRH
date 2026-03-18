import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

function computeTax(taxableIncome: number, brackets: Array<{ min: number; max: number | null; rate: number }>): number {
  let tax = 0;
  for (const b of brackets) {
    const end = b.max ?? Infinity;
    const slice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    tax += slice * b.rate;
  }
  return Math.max(0, tax);
}

function calcScenario(gross: number, bonusGross: number, benefitsValue: number, calculationDate: string) {
  const rules = getSalaryRulesByDate(calculationDate);
  const totalGross = gross + bonusGross + benefitsValue;
  const contributableBase = Math.min(totalGross, rules.cnssCeiling);
  const cnssEmployee = roundMAD(contributableBase * rules.cnssEmployeeRate);
  const cnssEmployer = roundMAD(contributableBase * rules.cnssEmployerRate);
  const amoEmployee = roundMAD(totalGross * rules.amoEmployeeRate);
  const amoEmployer = roundMAD(totalGross * rules.amoEmployerRate);
  const professionalExpenseDeduction = roundMAD(Math.min(totalGross * rules.professionalExpenseRate, rules.professionalExpenseCap));
  const taxableIncome = Math.max(0, totalGross - cnssEmployee - amoEmployee - professionalExpenseDeduction);
  const incomeTax = roundMAD(computeTax(taxableIncome, rules.taxBracketsMonthly));
  const net = roundMAD(totalGross - cnssEmployee - amoEmployee - incomeTax);
  const employerCost = roundMAD(totalGross + cnssEmployer + amoEmployer);
  return { totalGross: roundMAD(totalGross), net, incomeTax, employerCost };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const compensationOptimizationInputSchema = z.object({
  totalBudget: z.number().positive(), // employer total budget for this position
  calculationDate: z.string().date().default("2026-01-01"),
  // Scenario: pure salary
  salaryOnlyGross: z.number().positive(),
  // Scenario: salary + bonus
  salaryWithBonusGross: z.number().positive(),
  annualBonusGross: z.number().min(0).default(0),
  // Scenario: salary + benefits
  salaryWithBenefitsGross: z.number().positive(),
  benefitsMonthlyValue: z.number().min(0).default(0), // taxable portion
});

export type CompensationOptimizationInput = z.infer<typeof compensationOptimizationInputSchema>;

export type CompensationScenario = {
  label: string;
  gross: number;
  netMonthly: number;
  netAnnual: number;
  employerCost: number;
  incomeTax: number;
  taxEfficiency: number; // net/gross ratio
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

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateCompensationOptimization(raw: CompensationOptimizationInput): CompensationOptimizationResult {
  const input = compensationOptimizationInputSchema.parse(raw);

  const s1 = calcScenario(input.salaryOnlyGross, 0, 0, input.calculationDate);
  const s2 = calcScenario(input.salaryWithBonusGross, input.annualBonusGross / 12, 0, input.calculationDate);
  const s3 = calcScenario(input.salaryWithBenefitsGross, 0, input.benefitsMonthlyValue, input.calculationDate);

  const scenarios: CompensationScenario[] = [
    {
      label: "Salaire pur",
      gross: s1.totalGross,
      netMonthly: s1.net,
      netAnnual: roundMAD(s1.net * 12),
      employerCost: s1.employerCost,
      incomeTax: s1.incomeTax,
      taxEfficiency: roundMAD((s1.net / s1.totalGross) * 100),
    },
    {
      label: "Salaire + Prime mensuelle",
      gross: s2.totalGross,
      netMonthly: s2.net,
      netAnnual: roundMAD(s2.net * 12),
      employerCost: s2.employerCost,
      incomeTax: s2.incomeTax,
      taxEfficiency: roundMAD((s2.net / s2.totalGross) * 100),
    },
    {
      label: "Salaire + Avantages",
      gross: s3.totalGross,
      netMonthly: s3.net,
      netAnnual: roundMAD(s3.net * 12),
      employerCost: s3.employerCost,
      incomeTax: s3.incomeTax,
      taxEfficiency: roundMAD((s3.net / s3.totalGross) * 100),
    },
  ];

  const bestNet = scenarios.reduce((best, s) => (s.netMonthly > best.netMonthly ? s : best));
  const bestEfficiency = scenarios.reduce((best, s) => (s.taxEfficiency > best.taxEfficiency ? s : best));

  return {
    scenarios,
    bestNetScenario: bestNet.label,
    bestEfficiencyScenario: bestEfficiency.label,
    explanation: {
      summary: `Sur un budget employeur cible de ${input.totalBudget} MAD, le meilleur net est ${bestNet.label} (${bestNet.netMonthly} MAD/mois). Meilleure efficacite fiscale: ${bestEfficiency.label} (${bestEfficiency.taxEfficiency}% du brut conserve).`,
      warnings: [
        "Les avantages en nature sont taxables: ils augmentent l'assiette IR.",
        "Comparez aussi le cout total employeur: une prime peut couter plus a l'employeur.",
      ],
      nextSteps: [
        "Presentez ce comparatif a votre employeur pour arbitrer la structure salariale.",
        "Combinez les scenarios: salaire + avantages non-taxables + prime pour maximiser le net.",
      ],
    },
  };
}
