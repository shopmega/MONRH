import { describe, expect, it } from "vitest";
import { simulateEmployerTotalCost } from "@/lib/calculators/employer-total-cost";

describe("simulateEmployerTotalCost", () => {
  it("computes employer total cost", () => {
    const result = simulateEmployerTotalCost({
      calculationDate: "2026-02-12",
      grossSalary: 10000,
      sectorRisk: "medium",
      companySize: "large",
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.familyAllowanceEmployer).toBe(640);
    expect(result.breakdown.monthlyTotalCost).toBeGreaterThan(result.breakdown.grossSalary);
    expect(result.breakdown.monthlyTotalCost).toBe(11783.8);
  });
});
