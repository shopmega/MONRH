import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import {
  annualizeMonthlyBrackets,
  computeMonthlyPayrollFromGross,
  computeProgressiveTax,
  payrollCoreInputSchema,
  resolveProfessionalExpenseRuleMonthly,
  roundMAD,
} from "@/lib/calculators/payroll-core";

export const igrDetailInputSchema = payrollCoreInputSchema.extend({
  grossSalary: z.number().positive(),
  annualBonusGross: z.number().min(0).default(0),
});

export type IGRDetailInput = z.input<typeof igrDetailInputSchema>;

export type BracketDetail = {
  min: number;
  max: number | null;
  rate: number;
  taxableSlice: number;
  taxOnSlice: number;
};

export type IGRDetailResult = {
  calculationDate: string;
  versionCode: string;
  monthly: {
    gross: number;
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee: number;
    professionalExpenseDeduction: number;
    taxableIncome: number;
    incomeTax: number;
    net: number;
    marginalRate: number;
    effectiveRate: number;
    brackets: BracketDetail[];
  };
  annual: {
    grossWithBonus: number;
    estimatedAnnualTax: number;
    effectiveAnnualRate: number;
    regularizationDelta: number;
  };
  explanation: {
    summary: string;
    assumptions: string[];
    warnings: string[];
  };
};

export function simulateIGRDetail(raw: IGRDetailInput): IGRDetailResult {
  const input = igrDetailInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const monthly = computeMonthlyPayrollFromGross(input.grossSalary, input);
  const marginalRate = monthly.marginalRate;
  const effectiveRate = monthly.taxableIncome > 0 ? roundMAD((monthly.incomeTax / monthly.taxableIncome) * 100) : 0;

  const brackets: BracketDetail[] = rules.taxBracketsMonthly.map((bracket) => {
    const end = bracket.max ?? Infinity;
    const taxableSlice = Math.max(Math.min(monthly.taxableIncome, end) - bracket.min, 0);
    const taxOnSlice = taxableSlice * bracket.rate;
    return {
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      taxableSlice: roundMAD(taxableSlice),
      taxOnSlice: roundMAD(taxOnSlice),
    };
  });

  const annualGrossWithBonus = roundMAD(input.grossSalary * 12 + input.annualBonusGross);
  const professionalExpenseRule = resolveProfessionalExpenseRuleMonthly(input.grossSalary, rules);
  const annualTaxableBase = Math.max(
    0,
    annualGrossWithBonus -
      monthly.cnssEmployee * 12 -
      monthly.amoEmployee * 12 -
      Math.min(annualGrossWithBonus * professionalExpenseRule.rate, professionalExpenseRule.cap * 12) -
      input.additionalDeductionsAnnual,
  );
  const annualFamilyTaxReduction = monthly.familyTaxReduction * 12;
  const estimatedAnnualTax = Math.max(
    0,
    computeProgressiveTax(annualTaxableBase, annualizeMonthlyBrackets(rules)) - annualFamilyTaxReduction,
  );
  const alreadyWithheld = monthly.incomeTax * 12;
  const regularizationDelta = roundMAD(alreadyWithheld - estimatedAnnualTax);
  const effectiveAnnualRate = annualTaxableBase > 0 ? roundMAD((estimatedAnnualTax / annualTaxableBase) * 100) : 0;

  return {
    calculationDate: input.calculationDate,
    versionCode: rules.versionCode,
    monthly: {
      gross: roundMAD(input.grossSalary),
      cnssEmployee: monthly.cnssEmployee,
      amoEmployee: monthly.amoEmployee,
      cimrEmployee: monthly.cimrEmployee,
      professionalExpenseDeduction: monthly.professionalExpenseDeduction,
      taxableIncome: monthly.taxableIncome,
      incomeTax: monthly.incomeTax,
      net: monthly.net,
      marginalRate: roundMAD(marginalRate * 100),
      effectiveRate,
      brackets,
    },
    annual: {
      grossWithBonus: annualGrossWithBonus,
      estimatedAnnualTax: roundMAD(estimatedAnnualTax),
      effectiveAnnualRate,
      regularizationDelta,
    },
    explanation: {
      summary: `Taux marginal: ${marginalRate * 100}% | Taux effectif: ${effectiveRate}% | IR mensuel: ${monthly.incomeTax} MAD.`,
      assumptions: [
        "Baremes IR mensuels du Code General des Impots (version selectionnee).",
        "Deduction forfaitaire frais professionnels plafonnee.",
        input.includeCimr ? `CIMR incluse au taux ${roundMAD(input.cimrRate * 100)}%.` : "CIMR non incluse.",
        `Reduction charges de famille: ${monthly.familyTaxReduction} MAD/mois.`,
        input.annualBonusGross > 0
          ? "Prime annuelle traitee comme revenu imposable dans l'estimation annuelle."
          : "Aucune prime annuelle declaree.",
      ],
      warnings: [
        "Le taux effectif est toujours inferieur au taux marginal: seule la tranche haute est taxee a ce taux.",
        regularizationDelta > 0
          ? `Vous pourriez avoir un remboursement potentiel de ${regularizationDelta} MAD en declaration annuelle.`
          : regularizationDelta < 0
            ? `Un complement d'IR de ${Math.abs(regularizationDelta)} MAD pourrait etre du en regularisation annuelle.`
            : "Pas d'ecart significatif entre IR preleve a la source et IR annuel estime.",
      ],
    },
  };
}
