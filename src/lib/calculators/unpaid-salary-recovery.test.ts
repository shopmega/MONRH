import { describe, expect, it } from "vitest";
import { simulateUnpaidSalaryRecovery } from "@/lib/calculators/unpaid-salary-recovery";

describe("simulateUnpaidSalaryRecovery", () => {
  it("computes claim amount", () => {
    const result = simulateUnpaidSalaryRecovery({
      calculationDate: "2026-02-12",
      monthlySalary: 7000,
      unpaidMonths: 2,
      monthsSinceFirstDefault: 4,
      penaltyRateAnnual: 12,
    });

    expect(result.breakdown.principalAmount).toBe(14000);
    expect(result.breakdown.totalClaimAmount).toBeGreaterThan(result.breakdown.principalAmount);
  });
});
