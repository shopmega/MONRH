import { describe, expect, it } from "vitest";
import { simulateOvertime } from "@/lib/calculators/overtime";

describe("simulateOvertime", () => {
  it("computes overtime buckets and total", () => {
    const result = simulateOvertime({
      calculationDate: "2026-02-12",
      monthlySalary: 10000,
      overtimeDayHours: 4,
      overtimeNightHours: 2,
      overtimeRestOrHolidayDayHours: 3,
      overtimeRestOrHolidayNightHours: 1,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.baseHourlyRate).toBeGreaterThan(0);
    expect(result.breakdown.totalOvertimeAmount).toBeGreaterThan(0);
  });

  it("keeps legacy weekend and holiday payload fields compatible", () => {
    const result = simulateOvertime({
      calculationDate: "2026-02-12",
      monthlySalary: 19100,
      overtimeDayHours: 0,
      overtimeNightHours: 0,
      overtimeWeekendHours: 1,
      overtimeHolidayHours: 1,
    });

    expect(result.breakdown.baseHourlyRate).toBe(100);
    expect(result.breakdown.restOrHolidayDayAmount).toBe(150);
    expect(result.breakdown.restOrHolidayNightAmount).toBe(200);
    expect(result.breakdown.totalOvertimeAmount).toBe(350);
  });
});
