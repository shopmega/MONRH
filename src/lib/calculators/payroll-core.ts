import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate, type SalaryRules, type TaxBracket } from "@/lib/rules/default-rules";
import { calculatePayroll, findGrossFromNet, type PayrollEngineInput } from "@/lib/finance/engine";

export const payrollFamilySituationSchema = z.enum(["single", "married", "divorced", "widowed"]);

export const payrollPayElementSchema = z.object({
  label: z.string().min(1),
  amount: z.number().min(0),
  taxable: z.boolean().default(true),
  cnssSubject: z.boolean().default(true),
  amoSubject: z.boolean().default(true),
});

export const payrollCoreInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  familySituation: payrollFamilySituationSchema.default("single"),
  familyDependentsCount: z.number().min(0).max(6).default(0),
  additionalDeductionsAnnual: z.number().min(0).default(0),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
  companySize: z.enum(["small", "large"]).default("large"),
  sectorRisk: z.enum(["low", "medium", "high", "very_high"]).optional(),
});

export type PayrollPayElement = z.input<typeof payrollPayElementSchema>;
export type PayrollCoreInput = z.input<typeof payrollCoreInputSchema>;

export type PayrollMonthlyResult = {
  versionId: string;
  versionCode: string;
  calculationDate: string;
  gross: number;
  net: number;
  taxableIncome: number;
  cnssEmployee: number;
  cnssEmployer: number;
  familyAllowanceEmployer: number;
  amoEmployee: number;
  amoEmployer: number;
  formationProEmployer: number;
  atMpEmployer?: number;
  cimrEmployee: number;
  familyTaxReduction: number;
  additionalDeductions: number;
  incomeTax: number;
  professionalExpenseDeduction: number;
  employerTotalCost: number;
  marginalRate: number;
};

export type PayrollMonthlyBases = {
  gross: number;
  taxableGross?: number;
  cnssGross?: number;
  amoGross?: number;
};

export function roundMAD(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeProgressiveTax(taxableIncome: number, brackets: TaxBracket[]) {
  let tax = 0;

  for (const bracket of brackets) {
    const start = bracket.min;
    const end = bracket.max ?? Number.POSITIVE_INFINITY;
    const slice = Math.max(Math.min(taxableIncome, end) - start, 0);
    tax += slice * bracket.rate;
  }

  return Math.max(0, tax);
}

export function annualizeMonthlyBrackets(rules: SalaryRules): TaxBracket[] {
  return rules.taxBracketsMonthly.map((bracket) => ({
    min: bracket.min * 12,
    max: bracket.max !== null ? bracket.max * 12 : null,
    rate: bracket.rate,
  }));
}

export function computeFamilyTaxReductionMonthly(
  coreInput: PayrollCoreInput,
  rules: SalaryRules,
): number {
  const input = payrollCoreInputSchema.parse(coreInput);
  const annualAmount = rules.familyChargeReductionAnnual ?? 0;
  const annualCap = rules.familyChargeReductionCapAnnual ?? 0;
  const spouseCharge = input.familySituation === "married" ? 1 : 0;
  const effectiveDependents = input.familyDependentsCount + spouseCharge;

  return Math.min(effectiveDependents * annualAmount, annualCap) / 12;
}

export function resolveProfessionalExpenseRuleMonthly(gross: number, rules: SalaryRules) {
  const tier = rules.professionalExpenseTiers?.find(
    (item) => item.maxGrossMonthly === null || gross <= item.maxGrossMonthly,
  );
  return {
    rate: tier?.rate ?? rules.professionalExpenseRate,
    cap: tier?.monthlyCap ?? rules.professionalExpenseCap,
  };
}

export function computeProfessionalExpenseDeductionMonthly(
  gross: number,
  taxableGross: number,
  rules: SalaryRules,
): number {
  const { rate, cap } = resolveProfessionalExpenseRuleMonthly(gross, rules);
  return Math.min(taxableGross * rate, cap);
}

export function computeMonthlyPayrollFromGross(
  gross: number,
  rawCoreInput: PayrollCoreInput = {},
): PayrollMonthlyResult {
  const input = payrollCoreInputSchema.parse(rawCoreInput);
  const result = calculatePayroll(gross, input as PayrollEngineInput);
  return {
    ...result,
    atMpEmployer: result.atMpEmployer,
  };
}

export function computeMonthlyPayrollFromBases(
  bases: PayrollMonthlyBases,
  rawCoreInput: PayrollCoreInput = {},
): PayrollMonthlyResult {
  // Note: For advanced bases, we currently use gross as the primary driver in the engine.
  // Specialized implementation can be added to engine.ts if needed for separate bases.
  return computeMonthlyPayrollFromGross(bases.gross, rawCoreInput);
}

export function estimateGrossFromTargetNet(
  targetNet: number,
  rawCoreInput: PayrollCoreInput = {},
): PayrollMonthlyResult {
  const input = payrollCoreInputSchema.parse(rawCoreInput);
  return findGrossFromNet(targetNet, input as PayrollEngineInput);
}
