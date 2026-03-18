import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

function computeTax(
  taxableIncome: number,
  brackets: Array<{ min: number; max: number | null; rate: number }>,
): number {
  let tax = 0;
  for (const b of brackets) {
    const end = b.max ?? Infinity;
    const slice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    tax += slice * b.rate;
  }
  return Math.max(0, tax);
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const igrDetailInputSchema = z.object({
  grossSalary: z.number().positive(),
  calculationDate: z.string().date().default("2026-01-01"),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
  // Optional: additional annual income for reconciliation (13th month, primes)
  annualBonusGross: z.number().min(0).default(0),
});

export type IGRDetailInput = z.infer<typeof igrDetailInputSchema>;

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
    regularizationDelta: number; // potential refund (+) or owed (-)
  };
  explanation: {
    summary: string;
    assumptions: string[];
    warnings: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateIGRDetail(raw: IGRDetailInput): IGRDetailResult {
  const input = igrDetailInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);

  const contributableBase = Math.min(input.grossSalary, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const amoEmployee = input.grossSalary * rules.amoEmployeeRate;
  const cimrEmployee = input.includeCimr ? input.grossSalary * input.cimrRate : 0;
  const professionalExpenseDeduction = Math.min(
    input.grossSalary * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(0, input.grossSalary - cnssEmployee - amoEmployee - professionalExpenseDeduction);
  const incomeTax = computeTax(taxableIncome, rules.taxBracketsMonthly);
  const net = input.grossSalary - cnssEmployee - amoEmployee - cimrEmployee - incomeTax;

  // Marginal rate = highest bracket with non-zero taxable slice
  const marginalBracket = rules.taxBracketsMonthly.findLast((b) => taxableIncome > b.min);
  const marginalRate = marginalBracket?.rate ?? 0;
  const effectiveRate = taxableIncome > 0 ? roundMAD((incomeTax / taxableIncome) * 100) : 0;

  // Bracket breakdown
  const brackets: BracketDetail[] = rules.taxBracketsMonthly.map((b) => {
    const end = b.max ?? Infinity;
    const taxableSlice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    const taxOnSlice = taxableSlice * b.rate;
    return {
      min: b.min,
      max: b.max,
      rate: b.rate,
      taxableSlice: roundMAD(taxableSlice),
      taxOnSlice: roundMAD(taxOnSlice),
    };
  });

  // Annual reconciliation estimate
  const annualGrossWithBonus = roundMAD(input.grossSalary * 12 + input.annualBonusGross);
  const annualTaxableBase = Math.max(
    0,
    annualGrossWithBonus -
      cnssEmployee * 12 -
      amoEmployee * 12 -
      Math.min(input.grossSalary * rules.professionalExpenseRate * 12, rules.professionalExpenseCap * 12),
  );
  const annualBrackets = rules.taxBracketsMonthly.map((b) => ({
    ...b,
    min: b.min * 12,
    max: b.max !== null ? b.max * 12 : null,
  }));
  const estimatedAnnualTax = computeTax(annualTaxableBase, annualBrackets);
  const alreadyWithheld = incomeTax * 12;
  const regularizationDelta = roundMAD(alreadyWithheld - estimatedAnnualTax);
  const effectiveAnnualRate = annualTaxableBase > 0 ? roundMAD((estimatedAnnualTax / annualTaxableBase) * 100) : 0;

  return {
    calculationDate: input.calculationDate,
    versionCode: rules.versionCode,
    monthly: {
      gross: roundMAD(input.grossSalary),
      cnssEmployee: roundMAD(cnssEmployee),
      amoEmployee: roundMAD(amoEmployee),
      cimrEmployee: roundMAD(cimrEmployee),
      professionalExpenseDeduction: roundMAD(professionalExpenseDeduction),
      taxableIncome: roundMAD(taxableIncome),
      incomeTax: roundMAD(incomeTax),
      net: roundMAD(net),
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
      summary: `Taux marginal: ${marginalRate * 100}% | Taux effectif: ${effectiveRate}% | IR mensuel: ${roundMAD(incomeTax)} MAD.`,
      assumptions: [
        "Baremes IR mensuels du Code General des Impots (version selectionnee).",
        "Deduction forfaitaire frais professionnels plafonnee.",
        input.includeCimr ? `CIMR incluse au taux ${roundMAD(input.cimrRate * 100)}%.` : "CIMR non incluse.",
      ],
      warnings: [
        "Le taux effectif est toujours inferieur au taux marginal: seule la tranche haute est taxee a ce taux.",
        regularizationDelta > 0
          ? `Vous pourriez avoir un remboursement potentiel de ${regularizationDelta} MAD en declaration annuelle.`
          : regularizationDelta < 0
            ? `Un complement d'IR de ${Math.abs(regularizationDelta)} MAD pourrait etre du en regularisation annuelle.`
            : "Pas d'ecart significatif entre IR prelevé a la source et IR annuel estime.",
      ],
    },
  };
}
