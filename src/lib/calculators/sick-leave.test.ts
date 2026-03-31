import { describe, expect, it } from "vitest";
import { simulateSickLeave } from "@/lib/calculators/sick-leave";

describe("simulateSickLeave", () => {
  it("computes sick leave compensation", () => {
    const result = simulateSickLeave({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      sickDays: 10,
      cnssEligibilityDays: 54,
    });

    expect(result.breakdown.paidDaysByCnss).toBe(7);
    expect(result.breakdown.cnssCompensation).toBeGreaterThan(0);
  });
});
