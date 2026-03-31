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
});
