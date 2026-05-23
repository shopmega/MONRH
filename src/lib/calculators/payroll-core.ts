import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate, type SalaryRules, type TaxBracket } from "@/lib/rules/default-rules";

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
  cnssEmployeeShortTerm: number;
  cnssEmployeeLongTerm: number;
  cnssEmployee: number;
  cnssEmployerShortTerm: number;
  cnssEmployerLongTerm: number;
  cnssEmployer: number;
  familyAllowanceEmployer: number;
  amoEmployee: number;
  amoEmployer: number;
  formationProEmployer: number;
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

  return Math.min(input.familyDependentsCount * annualAmount, annualCap) / 12;
}

export function computeCnssEmployeeContribution(gross: number, rules: SalaryRules) {
  const longTermBase = Math.min(gross, rules.cnssCeiling);
  const shortTermRate = rules.cnssEmployeeShortTermRate ?? 0.0052;
  const longTermRate = rules.cnssEmployeeLongTermRate ?? Math.max(0, rules.cnssEmployeeRate - shortTermRate);
  const shortTerm = gross * shortTermRate;
  const longTerm = longTermBase * longTermRate;

  return {
    shortTerm,
    longTerm,
    total: shortTerm + longTerm,
  };
}

export function computeCnssEmployerContribution(gross: number, rules: SalaryRules) {
  const longTermBase = Math.min(gross, rules.cnssCeiling);
  const shortTermRate = rules.cnssEmployerShortTermRate ?? 0.0105;
  const longTermRate = rules.cnssEmployerLongTermRate ?? Math.max(0, rules.cnssEmployerRate - shortTermRate);
  const shortTerm = gross * shortTermRate;
  const longTerm = longTermBase * longTermRate;

  return {
    shortTerm,
    longTerm,
    total: shortTerm + longTerm,
  };
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
  return computeMonthlyPayrollFromBases({ gross }, rawCoreInput);
}

export function computeMonthlyPayrollFromBases(
  bases: PayrollMonthlyBases,
  rawCoreInput: PayrollCoreInput = {},
): PayrollMonthlyResult {
  const input = payrollCoreInputSchema.parse(rawCoreInput);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const taxableGross = bases.taxableGross ?? bases.gross;
  const cnssGross = bases.cnssGross ?? bases.gross;
  const amoGross = bases.amoGross ?? bases.gross;
  const employeeCnss = computeCnssEmployeeContribution(cnssGross, rules);
  const employerCnss = computeCnssEmployerContribution(cnssGross, rules);
  const cnssEmployee = employeeCnss.total;
  const cnssEmployer = employerCnss.total;
  const familyAllowanceEmployer = bases.gross * rules.familyAllowanceEmployerRate;
  const amoEmployee = amoGross * rules.amoEmployeeRate;
  const amoEmployer = amoGross * rules.amoEmployerRate;
  const formationProRate = input.companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;
  const formationProEmployer = bases.gross * formationProRate;
  const cimrEmployee = input.includeCimr ? bases.gross * input.cimrRate : 0;
  const additionalDeductions = input.additionalDeductionsAnnual / 12;
  const professionalExpenseDeduction = computeProfessionalExpenseDeductionMonthly(bases.gross, taxableGross, rules);
  const taxableIncome = Math.max(
    0,
    taxableGross - cnssEmployee - amoEmployee - professionalExpenseDeduction - additionalDeductions,
  );
  const familyTaxReduction = computeFamilyTaxReductionMonthly(input, rules);
  const incomeTax = Math.max(0, computeProgressiveTax(taxableIncome, rules.taxBracketsMonthly) - familyTaxReduction);
  const net = bases.gross - cnssEmployee - amoEmployee - cimrEmployee - incomeTax;
  const employerTotalCost = bases.gross + cnssEmployer + familyAllowanceEmployer + amoEmployer + formationProEmployer;
  const marginalRate = rules.taxBracketsMonthly.findLast((bracket) => taxableIncome > bracket.min)?.rate ?? 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    calculationDate: input.calculationDate,
    gross: roundMAD(bases.gross),
    net: roundMAD(net),
    taxableIncome: roundMAD(taxableIncome),
    cnssEmployeeShortTerm: roundMAD(employeeCnss.shortTerm),
    cnssEmployeeLongTerm: roundMAD(employeeCnss.longTerm),
    cnssEmployee: roundMAD(cnssEmployee),
    cnssEmployerShortTerm: roundMAD(employerCnss.shortTerm),
    cnssEmployerLongTerm: roundMAD(employerCnss.longTerm),
    cnssEmployer: roundMAD(cnssEmployer),
    familyAllowanceEmployer: roundMAD(familyAllowanceEmployer),
    amoEmployee: roundMAD(amoEmployee),
    amoEmployer: roundMAD(amoEmployer),
    formationProEmployer: roundMAD(formationProEmployer),
    cimrEmployee: roundMAD(cimrEmployee),
    familyTaxReduction: roundMAD(familyTaxReduction),
    additionalDeductions: roundMAD(additionalDeductions),
    incomeTax: roundMAD(incomeTax),
    professionalExpenseDeduction: roundMAD(professionalExpenseDeduction),
    employerTotalCost: roundMAD(employerTotalCost),
    marginalRate,
  };
}

export function estimateGrossFromTargetNet(
  targetNet: number,
  rawCoreInput: PayrollCoreInput = {},
): PayrollMonthlyResult {
  const input = payrollCoreInputSchema.parse(rawCoreInput);
  let low = targetNet;
  let high = targetNet * 2;
  let bestGross = high;

  for (let i = 0; i < 35; i += 1) {
    const mid = (low + high) / 2;
    const simulated = computeMonthlyPayrollFromGross(mid, input);
    if (simulated.net >= targetNet) {
      bestGross = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  return computeMonthlyPayrollFromGross(bestGross, input);
}
