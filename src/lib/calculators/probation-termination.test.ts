import { describe, expect, it } from "vitest";
import { simulateProbationTermination } from "@/lib/calculators/probation-termination";

describe("simulateProbationTermination", () => {
  it("computes probation notice gap", () => {
    const result = simulateProbationTermination({
      calculationDate: "2026-02-12",
      monthlySalary: 6000,
      workedDays: 20,
      initiator: "employer",
      noticeDaysGiven: 0,
    });

    expect(result.breakdown.requiredNoticeDays).toBeGreaterThan(0);
    expect(result.breakdown.compensationDue).toBeGreaterThan(0);
  });
});
