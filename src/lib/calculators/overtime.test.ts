import { describe, expect, it } from "vitest";
import { simulateOvertime } from "@/lib/calculators/overtime";

describe("simulateOvertime", () => {
  it("computes overtime buckets and total", () => {
    const result = simulateOvertime({
      calculationDate: "2026-02-12",
      monthlySalary: 10000,
      overtimeDayHours: 4,
      overtimeNightHours: 2,
      overtimeWeekendHours: 3,
      overtimeHolidayHours: 1,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.baseHourlyRate).toBeGreaterThan(0);
    expect(result.breakdown.totalOvertimeAmount).toBeGreaterThan(0);
  });
});
