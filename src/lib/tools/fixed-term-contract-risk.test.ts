import { describe, expect, it } from "vitest";
import { assessFixedTermContractRisk } from "@/lib/tools/fixed-term-contract-risk";

describe("assessFixedTermContractRisk", () => {
  it("returns low risk for a clean CDD setup", () => {
    const result = assessFixedTermContractRisk({
      contractReasonDocumented: true,
      contractHasEndDate: true,
      durationMonths: 6,
      renewalsCount: 0,
      roleIsPermanentNeed: false,
      trialPeriodDays: 15,
      salaryAndHoursClear: true,
      signedByBothParties: true,
    });

    expect(result.riskScore).toBe(0);
    expect(result.level).toBe("low");
    expect(result.issues).toHaveLength(0);
  });

  it("returns high risk when key legal safeguards are missing", () => {
    const result = assessFixedTermContractRisk({
      contractReasonDocumented: false,
      contractHasEndDate: false,
      durationMonths: 30,
      renewalsCount: 3,
      roleIsPermanentNeed: true,
      trialPeriodDays: 45,
      salaryAndHoursClear: false,
      signedByBothParties: false,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe("high");
    expect(result.issues.length).toBeGreaterThan(4);
  });
});
