import { describe, expect, it } from "vitest";
import { simulatePublicHolidayCompensation } from "@/lib/calculators/public-holiday-compensation";

describe("simulatePublicHolidayCompensation", () => {
  it("computes holiday compensation", () => {
    const result = simulatePublicHolidayCompensation({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      holidayHoursWorked: 8,
      alreadyPaidNormalDay: true,
    });

    expect(result.breakdown.compensationAmount).toBeGreaterThan(0);
    expect(result.breakdown.multiplierApplied).toBeGreaterThan(1);
  });
});
