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

  it("applies category-specific notice during probation", () => {
    const cadreResult = simulateProbationTermination({
      calculationDate: "2026-02-12",
      monthlySalary: 6000,
      workerCategory: "cadre",
      workedDays: 120,
      probationDurationMonths: 4,
      initiator: "employer",
      noticeDaysGiven: 0,
    });

    const employeResult = simulateProbationTermination({
      calculationDate: "2026-02-12",
      monthlySalary: 6000,
      workerCategory: "employe",
      workedDays: 120,
      probationDurationMonths: 4,
      initiator: "employer",
      noticeDaysGiven: 0,
    });

    expect(cadreResult.breakdown.requiredNoticeDays).toBe(15);
    expect(employeResult.breakdown.requiredNoticeDays).toBe(8);
    expect(cadreResult.breakdown.compensationDue).toBeGreaterThan(
      employeResult.breakdown.compensationDue,
    );
  });
});
