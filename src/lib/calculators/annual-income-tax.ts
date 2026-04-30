import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation } from "@/lib/calculators/shared";
import {
  annualizeMonthlyBrackets,
  computeFamilyTaxReductionMonthly,
  computeProgressiveTax,
  payrollFamilySituationSchema,
  roundMAD,
} from "@/lib/calculators/payroll-core";

export const annualIncomeTaxInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  paidMonths: z.number().min(1).max(14).default(12),
  bonusAmount: z.number().min(0).default(0),
  include13thSalary: z.boolean().default(false),
  familySituation: payrollFamilySituationSchema.default("single"),
  familyDependentsCount: z.number().min(0).max(6).default(0),
  additionalDeductionsAnnual: z.number().min(0).default(0),
});

export type AnnualIncomeTaxInput = z.input<typeof annualIncomeTaxInputSchema>;

export type AnnualIncomeTaxResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    annualGrossIncome: number;
    annualProfessionalDeduction: number;
    annualSocialContributions: number;
    additionalDeductionsAnnual: number;
    annualTaxableIncome: number;
    familyTaxReduction: number;
    annualIncomeTax: number;
    monthlyAverageTax: number;
    effectiveTaxRatePercent: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateAnnualIncomeTax(
  rawInput: AnnualIncomeTaxInput,
): AnnualIncomeTaxResult {
  const input = annualIncomeTaxInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const annualBrackets = annualizeMonthlyBrackets(rules);

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
    annualGrossIncome - annualProfessionalDeduction - annualSocialContributions - input.additionalDeductionsAnnual,
  );
  const familyTaxReduction = computeFamilyTaxReductionMonthly(input, rules) * 12;
  const annualIncomeTax = Math.max(0, computeProgressiveTax(annualTaxableIncome, annualBrackets) - familyTaxReduction);
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
      additionalDeductionsAnnual: roundMAD(input.additionalDeductionsAnnual),
      annualTaxableIncome: roundMAD(annualTaxableIncome),
      familyTaxReduction: roundMAD(familyTaxReduction),
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
        `Reduction IR charges de famille: ${roundMAD(familyTaxReduction)} MAD/an pour ${input.familyDependentsCount} personne(s) a charge.`,
        input.additionalDeductionsAnnual > 0
          ? `Deductions supplementaires: ${roundMAD(input.additionalDeductionsAnnual)} MAD/an.`
          : "Aucune deduction supplementaire declaree.",
      ],
      formulas: [
        "Revenu taxable annuel = brut annuel - deductions professionnelles - charges sociales.",
        "IR annuel = somme des tranches progressives sur le revenu taxable annuel.",
        "Reduction charges de famille deduite du montant d'IR apres calcul par tranches.",
        "Taux effectif = IR annuel / brut annuel.",
      ],
      warnings: [
        "Des exemptions ou regimes specifiques peuvent modifier le resultat reel.",
        input.include13thSalary && input.paidMonths >= 13
          ? "Attention: paidMonths inclut peut-etre deja le 13e mois. Verifiez pour eviter un double comptage."
          : "",
        input.familySituation === "married"
          ? "Le statut marie est traite comme une charge de famille fiscale dans cette simulation."
          : "",
      ].filter(Boolean),
      nextSteps: [
        "Comparer ce resultat avec vos declarations annuelles reelles.",
        "Tester scenarios avec/sans bonus pour anticipation fiscale.",
      ],
    },
  };
}
