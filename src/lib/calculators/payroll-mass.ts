import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
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

function calcEmployerCost(gross: number, calculationDate: string, companySize: "small" | "large"): {
  cnssEmployer: number;
  amoEmployer: number;
  formationPro: number;
  totalEmployerCost: number;
} {
  const rules = getSalaryRulesByDate(calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployer = roundMAD(contributableBase * rules.cnssEmployerRate);
  const amoEmployer = roundMAD(gross * rules.amoEmployerRate);
  const formationProRate = companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;
  const formationPro = roundMAD(gross * formationProRate);
  return {
    cnssEmployer,
    amoEmployer,
    formationPro,
    totalEmployerCost: roundMAD(gross + cnssEmployer + amoEmployer + formationPro),
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

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

// ─── Main function ────────────────────────────────────────────────────────────

export function simulatePayrollMass(raw: PayrollMassInput): PayrollMassResult {
  const input = payrollMassInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);

  const rawEmployees = input.employees || Array.from({ length: input.employeeCount || 1 }, (_, i) => ({
    name: `Employe ${i + 1}`,
    grossSalary: input.averageGrossSalary || 0,
  }));

  const employeeLines: EmployeePayrollLine[] = rawEmployees.map((emp) => {
    const contributableBase = Math.min(emp.grossSalary, rules.cnssCeiling);
    const cnssEmployee = roundMAD(contributableBase * rules.cnssEmployeeRate);
    const amoEmployee = roundMAD(emp.grossSalary * rules.amoEmployeeRate);
    const professionalExpenseDeduction = roundMAD(
      Math.min(emp.grossSalary * rules.professionalExpenseRate, rules.professionalExpenseCap),
    );
    const taxableIncome = Math.max(0, emp.grossSalary - cnssEmployee - amoEmployee - professionalExpenseDeduction);
    const incomeTax = roundMAD(computeTax(taxableIncome, rules.taxBracketsMonthly));
    const netSalary = roundMAD(emp.grossSalary - cnssEmployee - amoEmployee - incomeTax);
    const { totalEmployerCost } = calcEmployerCost(emp.grossSalary, input.calculationDate, input.companySize);
    return { name: emp.name, grossSalary: roundMAD(emp.grossSalary), netSalary, employerCost: totalEmployerCost, cnssEmployee, incomeTax };
  });

  const totals = employeeLines.reduce(
    (acc, e) => {
      const { cnssEmployer, amoEmployer, formationPro, totalEmployerCost } = calcEmployerCost(e.grossSalary, input.calculationDate, input.companySize);
      return {
        totalGross: roundMAD(acc.totalGross + e.grossSalary),
        totalNet: roundMAD(acc.totalNet + e.netSalary),
        totalEmployerCost: roundMAD(acc.totalEmployerCost + totalEmployerCost),
        totalCnssEmployee: roundMAD(acc.totalCnssEmployee + e.cnssEmployee),
        totalCnssEmployer: roundMAD(acc.totalCnssEmployer + cnssEmployer),
        totalIncomeTax: roundMAD(acc.totalIncomeTax + e.incomeTax),
        totalFormationPro: roundMAD(acc.totalFormationPro + formationPro),
      };
    },
    { totalGross: 0, totalNet: 0, totalEmployerCost: 0, totalCnssEmployee: 0, totalCnssEmployer: 0, totalIncomeTax: 0, totalFormationPro: 0 },
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
