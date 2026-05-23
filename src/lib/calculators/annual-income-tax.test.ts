import { describe, expect, it } from "vitest";
import { simulateAnnualIncomeTax } from "@/lib/calculators/annual-income-tax";

describe("simulateAnnualIncomeTax", () => {
  it("computes annual tax with bonus", () => {
    const result = simulateAnnualIncomeTax({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      paidMonths: 12,
      bonusAmount: 5000,
      include13thSalary: true,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.annualIncomeTax).toBeGreaterThan(0);
    expect(result.breakdown.annualGrossIncome).toBeGreaterThan(100000);
  });

  it("caps family charge reduction at 2160 MAD per year", () => {
    const result = simulateAnnualIncomeTax({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      paidMonths: 12,
      bonusAmount: 0,
      include13thSalary: false,
      familyDependentsCount: 6,
    });

    expect(result.breakdown.familyTaxReduction).toBe(2160);
    expect(result.breakdown.annualIncomeTax).toBeGreaterThanOrEqual(0);
  });

  it("deducts additional annual deductions from taxable income", () => {
    const base = simulateAnnualIncomeTax({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      paidMonths: 12,
      bonusAmount: 0,
      include13thSalary: false,
    });
    const withDeductions = simulateAnnualIncomeTax({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      paidMonths: 12,
      bonusAmount: 0,
      include13thSalary: false,
      additionalDeductionsAnnual: 12000,
    });

    expect(base.breakdown.annualTaxableIncome - withDeductions.breakdown.annualTaxableIncome).toBeCloseTo(12000, 2);
  });
});
