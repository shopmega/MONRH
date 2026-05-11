import { z } from "zod";
import { getSalaryRulesByDate, type SalaryRules, type TaxBracket } from "@/lib/rules/default-rules";
import { getCurrentDateISO, roundMAD } from "@/lib/calculators/shared";

/**
 * AT/MP (Work Accident / Occupational Disease) sector rate ranges.
 * In Morocco, AT/MP is employer-funded. Rate varies by sector risk class.
 */
export const AT_MP_RATES = {
  low: 0.005,     // e.g. services, finance, IT
  medium: 0.02,   // e.g. commerce, transport
  high: 0.04,     // e.g. construction, manufacturing
  very_high: 0.06, // e.g. mining, chemicals
} as const;

export type SectorRisk = keyof typeof AT_MP_RATES;

export const payrollFamilySituationSchema = z.enum(["single", "married", "divorced", "widowed"]);
export type FamilySituation = z.infer<typeof payrollFamilySituationSchema>;

export const payrollEngineInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  familySituation: payrollFamilySituationSchema.default("single"),
  familyDependentsCount: z.number().min(0).max(6).default(0),
  additionalDeductionsAnnual: z.number().min(0).default(0),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
  companySize: z.enum(["small", "large"]).default("large"),
  sectorRisk: z.enum(["low", "medium", "high", "very_high"]).default("medium"),
});

export type PayrollEngineInput = z.infer<typeof payrollEngineInputSchema>;

export type PayrollCalculationResult = {
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
  atMpEmployer: number;
  cimrEmployee: number;
  familyTaxReduction: number;
  additionalDeductions: number;
  incomeTax: number;
  professionalExpenseDeduction: number;
  employerTotalCost: number;
  marginalRate: number;
};

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

export function computeFamilyTaxReductionMonthly(
  input: { familySituation: FamilySituation; familyDependentsCount: number },
  rules: SalaryRules,
): number {
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

/**
 * The single source of truth for Moroccan payroll calculations.
 */
export function calculatePayroll(
  gross: number,
  options: Partial<PayrollEngineInput> = {}
): PayrollCalculationResult {
  const input = payrollEngineInputSchema.parse(options);
  const rules = getSalaryRulesByDate(input.calculationDate);

  // 1. Social Security (CNSS/AMO)
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = roundMAD(contributableBase * rules.cnssEmployeeRate);
  const cnssEmployer = roundMAD(contributableBase * rules.cnssEmployerRate);

  const familyAllowanceEmployer = roundMAD(gross * rules.familyAllowanceEmployerRate);

  const amoEmployee = roundMAD(gross * rules.amoEmployeeRate);
  const amoEmployer = roundMAD(gross * rules.amoEmployerRate);

  // 2. Employer-only Taxes
  const formationProRate = input.companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;
  const formationProEmployer = roundMAD(gross * formationProRate);

  const atMpRate = AT_MP_RATES[input.sectorRisk];
  const atMpEmployer = roundMAD(gross * atMpRate);

  // 3. Optional Private Pension (CIMR)
  const cimrEmployee = input.includeCimr ? roundMAD(gross * input.cimrRate) : 0;

  // 4. Deductions
  const professionalExpenseDeduction = roundMAD(computeProfessionalExpenseDeductionMonthly(gross, gross, rules));
  const additionalDeductions = roundMAD(input.additionalDeductionsAnnual / 12);

  // 5. Income Tax (IR)
  const taxableIncome = Math.max(
    0,
    gross - cnssEmployee - amoEmployee - professionalExpenseDeduction - additionalDeductions,
  );
  const familyTaxReduction = roundMAD(computeFamilyTaxReductionMonthly(input, rules));
  const incomeTax = Math.max(0, roundMAD(computeProgressiveTax(taxableIncome, rules.taxBracketsMonthly)) - familyTaxReduction);

  // 6. Final Results
  const net = roundMAD(gross - cnssEmployee - amoEmployee - cimrEmployee - incomeTax);
  const employerTotalCost = roundMAD(gross + cnssEmployer + familyAllowanceEmployer + amoEmployer + formationProEmployer + atMpEmployer);
  const marginalRate = rules.taxBracketsMonthly.findLast((bracket) => taxableIncome > bracket.min)?.rate ?? 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    calculationDate: input.calculationDate,
    gross: roundMAD(gross),
    net,
    taxableIncome: roundMAD(taxableIncome),
    cnssEmployee,
    cnssEmployer,
    familyAllowanceEmployer,
    amoEmployee,
    amoEmployer,
    formationProEmployer,
    atMpEmployer,
    cimrEmployee,
    familyTaxReduction,
    additionalDeductions,
    incomeTax: roundMAD(incomeTax),
    professionalExpenseDeduction,
    employerTotalCost,
    marginalRate,
  };
}

export function findGrossFromNet(
  targetNet: number,
  options: Partial<PayrollEngineInput> = {}
): PayrollCalculationResult {
  let low = targetNet;
  let high = targetNet * 2.5;
  let bestResult = calculatePayroll(high, options);

  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const simulated = calculatePayroll(mid, options);
    if (simulated.net >= targetNet) {
      bestResult = simulated;
      high = mid;
    } else {
      low = mid;
    }
  }

  return bestResult;
}
