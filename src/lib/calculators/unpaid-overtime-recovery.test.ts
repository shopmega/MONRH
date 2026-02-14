import { describe, expect, it } from "vitest";
import { simulateUnpaidOvertimeRecovery } from "@/lib/calculators/unpaid-overtime-recovery";

describe("simulateUnpaidOvertimeRecovery", () => {
  it("computes overtime recovery claim", () => {
    const result = simulateUnpaidOvertimeRecovery({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      unpaidDayHours: 10,
      unpaidNightHours: 5,
      unpaidWeekendHours: 2,
      unpaidHolidayHours: 0,
      delayMonths: 3,
      penaltyRatePerMonth: 0.01,
    });

    expect(result.breakdown.overtimePrincipal).toBeGreaterThan(0);
    expect(result.breakdown.totalClaimAmount).toBeGreaterThan(result.breakdown.overtimePrincipal);
  });
});
