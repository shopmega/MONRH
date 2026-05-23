import { describe, expect, it } from "vitest";
import { simulateNetGross } from "@/lib/calculators/net-gross";

describe("simulateNetGross", () => {
  it("computes net and employer cost from gross", () => {
    const result = simulateNetGross({
      direction: "gross_to_net",
      amount: 10000,
      calculationDate: "2026-02-12",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.gross).toBe(10000);
    expect(result.breakdown.net).toBeGreaterThan(7000);
    expect(result.breakdown.net).toBeLessThan(10000);
    expect(result.breakdown.cnssEmployer).toBe(580.8);
    expect(result.breakdown.familyAllowanceEmployer).toBe(640);
    expect(result.breakdown.formationProEmployer).toBe(160);
    expect(result.breakdown.employerTotalCost).toBe(11583.8);
  });

  it("estimates gross from target net", () => {
    const result = simulateNetGross({
      direction: "net_to_gross",
      amount: 8000,
      calculationDate: "2026-02-12",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.breakdown.net).toBeGreaterThanOrEqual(8000);
    expect(result.breakdown.gross).toBeGreaterThan(8000);
  });

  it("applies capped family charge reduction after tax calculation", () => {
    const noDependents = simulateNetGross({
      direction: "gross_to_net",
      amount: 10000,
      calculationDate: "2026-02-12",
      includeCimr: false,
      cimrRate: 0.06,
      familyDependentsCount: 0,
    });
    const cappedDependents = simulateNetGross({
      direction: "gross_to_net",
      amount: 10000,
      calculationDate: "2026-02-12",
      includeCimr: false,
      cimrRate: 0.06,
      familyDependentsCount: 6,
    });

    expect(cappedDependents.breakdown.familyTaxReduction).toBe(180);
    expect(noDependents.breakdown.incomeTax - cappedDependents.breakdown.incomeTax).toBeCloseTo(180, 2);
    expect(cappedDependents.breakdown.net - noDependents.breakdown.net).toBeCloseTo(180, 2);
  });
});
