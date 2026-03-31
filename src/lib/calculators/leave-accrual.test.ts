import { describe, expect, it } from "vitest";
import { simulateLeaveAccrual } from "@/lib/calculators/leave-accrual";

describe("simulateLeaveAccrual", () => {
  it("computes accrued and remaining leave", () => {
    const result = simulateLeaveAccrual({
      calculationDate: "2026-02-12",
      monthsWorked: 12,
      seniorityYears: 2,
      usedLeaveDays: 4,
      carriedDays: 2,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.accrualDays).toBe(18);
    expect(result.breakdown.remainingDays).toBeGreaterThan(0);
  });

  it("applies seniority bonus after 5 years", () => {
    const result = simulateLeaveAccrual({
      calculationDate: "2026-02-12",
      monthsWorked: 12,
      seniorityYears: 6,
      usedLeaveDays: 0,
      carriedDays: 0,
    });

    expect(result.breakdown.seniorityBonusDays).toBeGreaterThan(0);
  });
});
