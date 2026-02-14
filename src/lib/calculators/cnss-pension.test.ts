import { describe, expect, it } from "vitest";
import { simulateCnssPension } from "@/lib/calculators/cnss-pension";

describe("simulateCnssPension", () => {
  it("computes pension projection", () => {
    const result = simulateCnssPension({
      calculationDate: "2026-02-12",
      averageSalary: 9000,
      contributionDays: 4320,
      retirementAge: 60,
    });

    expect(result.breakdown.replacementRatePercent).toBeGreaterThan(0);
    expect(result.breakdown.estimatedMonthlyPension).toBeGreaterThan(0);
  });

  it("returns zero pension when contribution days are below legal threshold", () => {
    const result = simulateCnssPension({
      calculationDate: "2026-02-12",
      averageSalary: 9000,
      contributionDays: 1000,
      retirementAge: 60,
    });

    expect(result.breakdown.replacementRatePercent).toBe(0);
    expect(result.breakdown.estimatedMonthlyPension).toBe(0);
  });
});
