import { describe, expect, it } from "vitest";
import { simulateLicenciement } from "@/lib/calculators/licenciement";

describe("simulateLicenciement", () => {
  it("returns non-zero indemnities for a standard case", () => {
    const result = simulateLicenciement({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 6,
      monthsOfService: 0,
      unusedLeaveDays: 12,
      abusive: false,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.indemnityLegale).toBeGreaterThan(0);
    expect(result.breakdown.indemnitePreavis).toBeGreaterThan(0);
    expect(result.breakdown.congesPayesRestants).toBeGreaterThan(0);
    expect(result.breakdown.dommagesAbusif).toBe(0);
  });

  it("adds abusive damages when abusive = true", () => {
    const result = simulateLicenciement({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 3,
      monthsOfService: 6,
      unusedLeaveDays: 0,
      abusive: true,
    });

    expect(result.breakdown.dommagesAbusif).toBeGreaterThan(0);
    expect(result.breakdown.totalEstimated).toBeGreaterThan(result.breakdown.indemnityLegale);
  });
});
