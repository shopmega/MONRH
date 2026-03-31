import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const annualIncomeTaxInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  paidMonths: z.number().min(1).max(14).default(12),
  bonusAmount: z.number().min(0).default(0),
  include13thSalary: z.boolean().default(false),
});

export type AnnualIncomeTaxInput = z.infer<typeof annualIncomeTaxInputSchema>;

export type AnnualIncomeTaxResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    annualGrossIncome: number;
    annualProfessionalDeduction: number;
    annualSocialContributions: number;
    annualTaxableIncome: number;
    annualIncomeTax: number;
    monthlyAverageTax: number;
    effectiveTaxRatePercent: number;
  };
  explanation: CalculatorExplanation;
};

function computeProgressiveTax(
  taxableIncome: number,
  annualBrackets: Array<{ min: number; max: number | null; rate: number }>,
) {
  let tax = 0;
  for (const bracket of annualBrackets) {
    const start = bracket.min;
    const end = bracket.max ?? Number.POSITIVE_INFINITY;
    const slice = Math.max(Math.min(taxableIncome, end) - start, 0);
    tax += slice * bracket.rate;
  }
  return Math.max(0, tax);
}

export function simulateAnnualIncomeTax(
  rawInput: AnnualIncomeTaxInput,
): AnnualIncomeTaxResult {
  const input = annualIncomeTaxInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const annualBrackets = rules.taxBracketsMonthly.map((item) => ({
    min: item.min * 12,
    max: item.max ? item.max * 12 : null,
    rate: item.rate,
  }));

  const annualGrossIncome =
    input.monthlySalary * input.paidMonths +
    input.bonusAmount +
    (input.include13thSalary ? input.monthlySalary : 0);

  const annualProfessionalDeduction = Math.min(
    annualGrossIncome * rules.professionalExpenseRate,
    rules.professionalExpenseCap * 12,
  );

  const contributableBaseMonthly = Math.min(input.monthlySalary, rules.cnssCeiling);
  const annualSocialContributions =
    contributableBaseMonthly * rules.cnssEmployeeRate * input.paidMonths +
    input.monthlySalary * rules.amoEmployeeRate * input.paidMonths;

  const annualTaxableIncome = Math.max(
    0,
    annualGrossIncome - annualProfessionalDeduction - annualSocialContributions,
  );
  const annualIncomeTax = computeProgressiveTax(annualTaxableIncome, annualBrackets);
  const monthlyAverageTax = annualIncomeTax / 12;
  const effectiveTaxRatePercent =
    annualGrossIncome > 0 ? (annualIncomeTax / annualGrossIncome) * 100 : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      annualGrossIncome: roundMAD(annualGrossIncome),
      annualProfessionalDeduction: roundMAD(annualProfessionalDeduction),
      annualSocialContributions: roundMAD(annualSocialContributions),
      annualTaxableIncome: roundMAD(annualTaxableIncome),
      annualIncomeTax: roundMAD(annualIncomeTax),
      monthlyAverageTax: roundMAD(monthlyAverageTax),
      effectiveTaxRatePercent: roundMAD(effectiveTaxRatePercent),
    },
    explanation: {
      summary: `L'IR annuel estime est ${roundMAD(annualIncomeTax)} MAD, soit ${roundMAD(monthlyAverageTax)} MAD par mois en moyenne.`,
      assumptions: [
        "La grille IR mensuelle est annualisee par multiplication par 12.",
        "Les charges sociales salarie sont deduites avant calcul IR.",
        "Le bonus et le 13e mois sont integres dans le revenu annuel brut.",
      ],
      formulas: [
        "Revenu taxable annuel = brut annuel - deductions professionnelles - charges sociales.",
        "IR annuel = somme des tranches progressives sur le revenu taxable annuel.",
        "Taux effectif = IR annuel / brut annuel.",
      ],
      warnings: [
        "Des exemptions ou regimes specifiques peuvent modifier le resultat reel.",
      ],
      nextSteps: [
        "Comparer ce resultat avec vos declarations annuelles reelles.",
        "Tester scenarios avec/sans bonus pour anticipation fiscale.",
      ],
    },
  };
}
