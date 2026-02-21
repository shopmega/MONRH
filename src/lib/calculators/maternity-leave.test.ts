import { describe, expect, it } from "vitest";
import { simulateMaternityLeave } from "@/lib/calculators/maternity-leave";

describe("simulateMaternityLeave", () => {
  it("computes maternity income estimate", () => {
    const result = simulateMaternityLeave({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      leaveWeeks: 14,
      cnssContributedMonths: 5,
      employerTopUp: false,
    });

    expect(result.breakdown.cnssCompensation).toBeGreaterThan(0);
    expect(result.breakdown.totalEstimatedIncome).toBeGreaterThan(0);
  });

  it("caps CNSS-covered period to legal leave weeks", () => {
    const result = simulateMaternityLeave({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      leaveWeeks: 20,
      cnssContributedMonths: 5,
      employerTopUp: false,
    });

    expect(result.breakdown.totalEstimatedIncome).toBeLessThan(9000 * (20 / 4.33));
  });
});
