import { describe, expect, it } from "vitest";
import { simulateSeniorityGrowth } from "@/lib/calculators/seniority-growth";

describe("simulateSeniorityGrowth", () => {
  it("computes indemnity growth", () => {
    const result = simulateSeniorityGrowth({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      currentYears: 4,
      additionalYears: 3,
    });

    expect(result.breakdown.futureIndemnityEstimate).toBeGreaterThan(
      result.breakdown.currentIndemnityEstimate,
    );
    expect(result.breakdown.growthAmount).toBeGreaterThan(0);
  });
});
