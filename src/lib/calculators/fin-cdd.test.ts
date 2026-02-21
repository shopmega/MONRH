import { describe, expect, it } from "vitest";
import { simulateFinCdd } from "@/lib/calculators/fin-cdd";

describe("simulateFinCdd", () => {
  it("computes end-of-cdd payout", () => {
    const result = simulateFinCdd({
      calculationDate: "2026-02-12",
      monthlySalary: 7000,
      contractMonths: 12,
      unusedLeaveDays: 8,
      contractSubtype: "standard",
      renewalCount: 0,
      totalMonthsWithRenewals: 12,
      noticeDays: 0,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.primePrecarite).toBeGreaterThan(0);
    expect(result.breakdown.totalEndOfContractAmount).toBeGreaterThan(0);
  });
});
