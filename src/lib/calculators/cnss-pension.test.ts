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
    expect(result.breakdown.estimatedMonthlyPensionCnss).toBeGreaterThan(0);
    expect(result.breakdown.estimatedMonthlyPensionCnss).toBe(3300);
    expect(result.breakdown.openingContributionDaysRequired).toBe(1320);
    expect(result.breakdown.fullFormulaContributionDaysRequired).toBe(3240);
  });

  it("returns zero pension when contribution days are below legal threshold", () => {
    const result = simulateCnssPension({
      calculationDate: "2026-02-12",
      averageSalary: 9000,
      contributionDays: 1000,
      retirementAge: 60,
    });

    expect(result.breakdown.replacementRatePercent).toBe(0);
    expect(result.breakdown.estimatedMonthlyPensionCnss).toBe(0);
  });

  it("opens eligibility from 1320 days without treating it as the full formula base", () => {
    const result = simulateCnssPension({
      calculationDate: "2026-02-12",
      averageSalary: 6000,
      contributionDays: 1320,
      retirementAge: 60,
    });

    expect(result.breakdown.cnssEligible).toBe(true);
    expect(result.breakdown.replacementRatePercent).toBeLessThan(50);
    expect(result.breakdown.fullFormulaContributionDaysRequired).toBe(3240);
  });

  it("derives projected age from birth date when present", () => {
    const result = simulateCnssPension({
      calculationDate: "2026-02-12",
      averageSalary: 6000,
      contributionDays: 3240,
      birthDate: "1966-02-01",
      retirementAge: 55,
    });

    expect(result.breakdown.projectedRetirementAge).toBe(60);
    expect(result.breakdown.estimatedMonthlyPensionCnss).toBeGreaterThan(0);
  });
});
