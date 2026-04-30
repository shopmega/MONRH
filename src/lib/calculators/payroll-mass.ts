import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { computeMonthlyPayrollFromGross, roundMAD } from "@/lib/calculators/payroll-core";

export const payrollMassInputSchema = z.object({
  employees: z.array(
    z.object({
      name: z.string().max(80),
      grossSalary: z.number().positive(),
    }),
  ).optional(),
  employeeCount: z.number().int().min(1).optional(),
  averageGrossSalary: z.number().positive().optional(),
  calculationDate: z.string().date().default(getCurrentDateISO),
  companySize: z.enum(["small", "large"]).default("large"),
}).refine(data => data.employees || (data.employeeCount && data.averageGrossSalary), {
  message: "Either 'employees' list or both 'employeeCount' and 'averageGrossSalary' must be provided.",
});

export type PayrollMassInput = z.infer<typeof payrollMassInputSchema>;

export type EmployeePayrollLine = {
  name: string;
  grossSalary: number;
  netSalary: number;
  employerCost: number;
  cnssEmployee: number;
  incomeTax: number;
};

export type PayrollMassResult = {
  employeeCount: number;
  employees: EmployeePayrollLine[];
  totals: {
    totalGross: number;
    totalNet: number;
    totalEmployerCost: number;
    totalCnssEmployee: number;
    totalCnssEmployer: number;
    totalIncomeTax: number;
    totalFormationPro: number;
  };
  averageSalary: number;
  explanation: {
    summary: string;
  };
};

export function simulatePayrollMass(raw: PayrollMassInput): PayrollMassResult {
  const input = payrollMassInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);
  const formationProRate = input.companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;

  const rawEmployees = input.employees || Array.from({ length: input.employeeCount || 1 }, (_, i) => ({
    name: `Employe ${i + 1}`,
    grossSalary: input.averageGrossSalary || 0,
  }));

  const employeeLines: EmployeePayrollLine[] = rawEmployees.map((employee) => {
    const payroll = computeMonthlyPayrollFromGross(employee.grossSalary, input);
    const formationPro = roundMAD(payroll.gross * formationProRate);
    return {
      name: employee.name,
      grossSalary: payroll.gross,
      netSalary: payroll.net,
      employerCost: roundMAD(payroll.employerTotalCost + formationPro),
      cnssEmployee: payroll.cnssEmployee,
      incomeTax: payroll.incomeTax,
    };
  });

  const totals = employeeLines.reduce(
    (acc, employee) => {
      const payroll = computeMonthlyPayrollFromGross(employee.grossSalary, input);
      const formationPro = roundMAD(payroll.gross * formationProRate);
      return {
        totalGross: roundMAD(acc.totalGross + employee.grossSalary),
        totalNet: roundMAD(acc.totalNet + employee.netSalary),
        totalEmployerCost: roundMAD(acc.totalEmployerCost + employee.employerCost),
        totalCnssEmployee: roundMAD(acc.totalCnssEmployee + employee.cnssEmployee),
        totalCnssEmployer: roundMAD(acc.totalCnssEmployer + payroll.cnssEmployer),
        totalIncomeTax: roundMAD(acc.totalIncomeTax + employee.incomeTax),
        totalFormationPro: roundMAD(acc.totalFormationPro + formationPro),
      };
    },
    {
      totalGross: 0,
      totalNet: 0,
      totalEmployerCost: 0,
      totalCnssEmployee: 0,
      totalCnssEmployer: 0,
      totalIncomeTax: 0,
      totalFormationPro: 0,
    },
  );

  const averageSalary = input.averageGrossSalary || roundMAD(totals.totalGross / rawEmployees.length);

  return {
    employeeCount: rawEmployees.length,
    employees: employeeLines,
    totals,
    averageSalary,
    explanation: {
      summary: `${rawEmployees.length} employes | Masse brute: ${totals.totalGross} MAD | Cout total employeur: ${totals.totalEmployerCost} MAD/mois`,
    },
  };
}
