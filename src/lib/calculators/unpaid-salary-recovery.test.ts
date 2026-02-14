import { describe, expect, it } from "vitest";
import { simulateUnpaidSalaryRecovery } from "@/lib/calculators/unpaid-salary-recovery";

describe("simulateUnpaidSalaryRecovery", () => {
  it("computes claim amount", () => {
    const result = simulateUnpaidSalaryRecovery({
      calculationDate: "2026-02-12",
      monthlySalary: 7000,
      unpaidMonths: 2,
      delayMonths: 4,
      penaltyRatePerMonth: 0.01,
    });

    expect(result.breakdown.principalAmount).toBe(14000);
    expect(result.breakdown.totalClaimAmount).toBeGreaterThan(result.breakdown.principalAmount);
  });
});
