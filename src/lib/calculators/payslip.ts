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

// ─── Schema ───────────────────────────────────────────────────────────────────

export const payslipInputSchema = z.object({
  employeeName: z.string().max(100),
  employerId: z.string().max(100).default(""),
  period: z.string().max(20), // e.g. "Mars 2026"
  grossSalary: z.number().positive(),
  calculationDate: z.string().date().default("2026-01-01"),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
  // Additional pay elements
  overtimePay: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  // Employer formation pro (small or large company)
  companySize: z.enum(["small", "large"]).default("small"),
});

export type PayslipInput = z.infer<typeof payslipInputSchema>;

export type PayslipResult = {
  period: string;
  employeeName: string;
  employerId: string;
  calculationDate: string;
  earnings: {
    baseSalary: number;
    overtimePay: number;
    bonus: number;
    allowances: number;
    totalGross: number;
  };
  deductions: {
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee: number;
    professionalExpenseDeduction: number;
    taxableIncome: number;
    incomeTax: number;
    totalDeductions: number;
  };
  netToPay: number;
  employerContributions: {
    cnssEmployer: number;
    amoEmployer: number;
    formationPro: number;
    totalEmployerCost: number;
  };
  explanation: {
    summary: string;
    versionCode: string;
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function generatePayslip(raw: PayslipInput): PayslipResult {
  const input = payslipInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);

  const totalGross = roundMAD(input.grossSalary + input.overtimePay + input.bonus + input.allowances);

  const contributableBase = Math.min(totalGross, rules.cnssCeiling);
  const cnssEmployee = roundMAD(contributableBase * rules.cnssEmployeeRate);
  const cnssEmployer = roundMAD(contributableBase * rules.cnssEmployerRate);
  const amoEmployee = roundMAD(totalGross * rules.amoEmployeeRate);
  const amoEmployer = roundMAD(totalGross * rules.amoEmployerRate);
  const cimrEmployee = input.includeCimr ? roundMAD(totalGross * input.cimrRate) : 0;
  const professionalExpenseDeduction = roundMAD(
    Math.min(totalGross * rules.professionalExpenseRate, rules.professionalExpenseCap),
  );
  const taxableIncome = roundMAD(Math.max(0, totalGross - cnssEmployee - amoEmployee - professionalExpenseDeduction));
  const incomeTax = roundMAD(computeTax(taxableIncome, rules.taxBracketsMonthly));
  const totalDeductions = roundMAD(cnssEmployee + amoEmployee + cimrEmployee + incomeTax);
  const netToPay = roundMAD(totalGross - totalDeductions);

  const formationProRate = input.companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;
  const formationPro = roundMAD(totalGross * formationProRate);
  const totalEmployerCost = roundMAD(totalGross + cnssEmployer + amoEmployer + formationPro);

  return {
    period: input.period,
    employeeName: input.employeeName,
    employerId: input.employerId,
    calculationDate: input.calculationDate,
    earnings: {
      baseSalary: roundMAD(input.grossSalary),
      overtimePay: roundMAD(input.overtimePay),
      bonus: roundMAD(input.bonus),
      allowances: roundMAD(input.allowances),
      totalGross,
    },
    deductions: {
      cnssEmployee,
      amoEmployee,
      cimrEmployee,
      professionalExpenseDeduction,
      taxableIncome,
      incomeTax,
      totalDeductions,
    },
    netToPay,
    employerContributions: {
      cnssEmployer,
      amoEmployer,
      formationPro,
      totalEmployerCost,
    },
    explanation: {
      summary: `Bulletin de paie ${input.period} — Brut: ${totalGross} MAD | Net a payer: ${netToPay} MAD`,
      versionCode: rules.versionCode,
    },
  };
}
