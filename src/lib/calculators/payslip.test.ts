import { describe, expect, it } from "vitest";
import { generatePayslip } from "@/lib/calculators/payslip";

describe("generatePayslip", () => {
  it("applies the 2026 Moroccan CNSS and IR payroll split", () => {
    const result = generatePayslip({
      calculationDate: "2026-05-22",
      employeeName: "Test Employee",
      period: "mai 2026",
      grossSalary: 10000,
      familyDependentsCount: 6,
      companySize: "small",
    });

    expect(result.deductions.cnssEmployeeShortTerm).toBe(52);
    expect(result.deductions.cnssEmployeeLongTerm).toBe(237.6);
    expect(result.deductions.cnssEmployee).toBe(289.6);
    expect(result.employerContributions.cnssEmployerShortTerm).toBe(105);
    expect(result.employerContributions.cnssEmployerLongTerm).toBe(475.8);
    expect(result.employerContributions.cnssEmployer).toBe(580.8);
    expect(result.employerContributions.amoEmployer).toBe(203);
    expect(result.employerContributions.formationPro).toBe(160);
    expect(result.deductions.professionalExpenseDeduction).toBe(2000);
    expect(result.deductions.familyTaxReduction).toBe(180);
    expect(result.deductions.taxableIncome).toBe(7484.4);
  });
});
