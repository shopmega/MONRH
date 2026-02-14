import { describe, expect, it } from "vitest";
import { simulateWorkAccident } from "@/lib/calculators/work-accident";

describe("simulateWorkAccident", () => {
  it("computes accident compensation estimate", () => {
    const result = simulateWorkAccident({
      calculationDate: "2026-02-12",
      monthlySalary: 8500,
      temporaryIncapacityDays: 20,
      permanentIncapacityPercent: 10,
    });

    expect(result.breakdown.temporaryCompensation).toBeGreaterThan(0);
    expect(result.breakdown.totalFirstYearEstimate).toBeGreaterThan(0);
  });
});
