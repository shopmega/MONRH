import { describe, expect, it } from "vitest";
import { simulateEmployerTotalCost } from "@/lib/calculators/employer-total-cost";

describe("simulateEmployerTotalCost", () => {
  it("computes employer total cost", () => {
    const result = simulateEmployerTotalCost({
      calculationDate: "2026-02-12",
      grossSalary: 10000,
      insuranceRate: 0.015,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.totalCostToCompany).toBeGreaterThan(result.breakdown.grossSalary);
  });
});
