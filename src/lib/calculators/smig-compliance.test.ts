import { describe, expect, it } from "vitest";
import { simulateSmigCompliance } from "@/lib/calculators/smig-compliance";

describe("simulateSmigCompliance", () => {
  it("flags non-compliant salary", () => {
    const result = simulateSmigCompliance({
      calculationDate: "2026-02-12",
      salaryType: "smig",
      baseSalaryMad: 2000,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.compliant).toBe(false);
    expect(result.breakdown.gapMad).toBeLessThan(0);
  });

  it("flags compliant salary", () => {
    const result = simulateSmigCompliance({
      calculationDate: "2026-02-12",
      salaryType: "smig",
      baseSalaryMad: 5000,
    });

    expect(result.breakdown.compliant).toBe(true);
    expect(result.breakdown.gapMad).toBeGreaterThan(0);
  });
});
