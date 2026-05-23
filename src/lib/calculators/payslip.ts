import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import {
  computeMonthlyPayrollFromBases,
  computeMonthlyPayrollFromGross,
  payrollCoreInputSchema,
  payrollPayElementSchema,
  roundMAD,
} from "@/lib/calculators/payroll-core";

const payslipPayElementSchema = payrollPayElementSchema.extend({
  category: z.enum(["overtime", "bonus", "allowance", "benefit", "other"]).default("other"),
});

export const payslipInputSchema = payrollCoreInputSchema.extend({
  employeeName: z.string().max(100),
  employerId: z.string().max(100).default(""),
  period: z.string().max(20),
  grossSalary: z.number().positive(),
  overtimePay: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  payElements: z.array(payslipPayElementSchema).default([]),
  companySize: z.enum(["small", "large"]).default("small"),
});

export type PayslipInput = z.input<typeof payslipInputSchema>;

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
    cnssEmployeeShortTerm: number;
    cnssEmployeeLongTerm: number;
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee: number;
    professionalExpenseDeduction: number;
    taxableIncome: number;
    familyTaxReduction: number;
    incomeTax: number;
    totalDeductions: number;
  };
  netToPay: number;
  employerContributions: {
    cnssEmployerShortTerm: number;
    cnssEmployerLongTerm: number;
    cnssEmployer: number;
    familyAllowanceEmployer: number;
    amoEmployer: number;
    formationPro: number;
    totalEmployerCost: number;
  };
  explanation: {
    summary: string;
    versionCode: string;
    warnings: string[];
  };
};

export function generatePayslip(raw: PayslipInput): PayslipResult {
  const input = payslipInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const structuredGross = input.payElements.reduce((sum, item) => sum + item.amount, 0);
  const legacyVariableGross = input.overtimePay + input.bonus + input.allowances;
  const variableGross = structuredGross > 0 ? structuredGross : legacyVariableGross;
  const totalGross = roundMAD(input.grossSalary + variableGross);
  const payroll =
    structuredGross > 0
      ? computeMonthlyPayrollFromBases(
          {
            gross: totalGross,
            taxableGross: input.grossSalary + sumPayElementBase(input.payElements, "taxable"),
            cnssGross: input.grossSalary + sumPayElementBase(input.payElements, "cnssSubject"),
            amoGross: input.grossSalary + sumPayElementBase(input.payElements, "amoSubject"),
          },
          input,
        )
      : computeMonthlyPayrollFromGross(totalGross, input);
  const formationPro = payroll.formationProEmployer;
  const totalEmployerCost = payroll.employerTotalCost;
  const totalDeductions = roundMAD(
    payroll.cnssEmployee + payroll.amoEmployee + payroll.cimrEmployee + payroll.incomeTax,
  );

  return {
    period: input.period,
    employeeName: input.employeeName,
    employerId: input.employerId,
    calculationDate: input.calculationDate,
    earnings: {
      baseSalary: roundMAD(input.grossSalary),
      overtimePay: structuredGross > 0 ? roundMAD(sumCategory(input.payElements, "overtime")) : roundMAD(input.overtimePay),
      bonus: structuredGross > 0 ? roundMAD(sumCategory(input.payElements, "bonus")) : roundMAD(input.bonus),
      allowances: structuredGross > 0 ? roundMAD(sumCategory(input.payElements, "allowance") + sumCategory(input.payElements, "benefit")) : roundMAD(input.allowances),
      totalGross,
    },
    deductions: {
      cnssEmployeeShortTerm: payroll.cnssEmployeeShortTerm,
      cnssEmployeeLongTerm: payroll.cnssEmployeeLongTerm,
      cnssEmployee: payroll.cnssEmployee,
      amoEmployee: payroll.amoEmployee,
      cimrEmployee: payroll.cimrEmployee,
      professionalExpenseDeduction: payroll.professionalExpenseDeduction,
      taxableIncome: payroll.taxableIncome,
      familyTaxReduction: payroll.familyTaxReduction,
      incomeTax: payroll.incomeTax,
      totalDeductions,
    },
    netToPay: payroll.net,
    employerContributions: {
      cnssEmployerShortTerm: payroll.cnssEmployerShortTerm,
      cnssEmployerLongTerm: payroll.cnssEmployerLongTerm,
      cnssEmployer: payroll.cnssEmployer,
      familyAllowanceEmployer: payroll.familyAllowanceEmployer,
      amoEmployer: payroll.amoEmployer,
      formationPro,
      totalEmployerCost,
    },
    explanation: {
      summary: `Bulletin de paie ${input.period} - Brut: ${totalGross} MAD | Net a payer: ${payroll.net} MAD`,
      versionCode: rules.versionCode,
      warnings: [
        structuredGross > 0
          ? "Les elements de paie structures remplacent les champs historiques prime/heures supplementaires/indemnites."
          : "Les champs historiques sont conserves; preferer payElements pour tracer chaque element de paie.",
      ],
    },
  };
}

function sumCategory(
  payElements: Array<z.infer<typeof payslipPayElementSchema>>,
  category: z.infer<typeof payslipPayElementSchema>["category"],
): number {
  return payElements.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
}

function sumPayElementBase(
  payElements: Array<z.infer<typeof payslipPayElementSchema>>,
  baseFlag: "taxable" | "cnssSubject" | "amoSubject",
): number {
  return payElements.filter((item) => item[baseFlag]).reduce((sum, item) => sum + item.amount, 0);
}
