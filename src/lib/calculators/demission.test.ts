import { describe, expect, it } from "vitest";
import { simulateDemission } from "@/lib/calculators/demission";

describe("simulateDemission", () => {
  it("computes resignation outcome", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      yearsOfService: 2,
      monthsOfService: 0,
      unusedLeaveDays: 10,
      noticeServed: true,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.leavePayout).toBeGreaterThan(0);
    expect(result.breakdown.noticeCompensationDue).toBe(0);
  });

  it("applies category-specific notice for CDI resignation", () => {
    const cadreResult = simulateDemission({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "cadre",
      contractType: "CDI",
      yearsOfService: 3,
      monthsOfService: 0,
      unusedLeaveDays: 0,
      noticeServed: false,
    });

    const employeResult = simulateDemission({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      yearsOfService: 3,
      monthsOfService: 0,
      unusedLeaveDays: 0,
      noticeServed: false,
    });

    expect(cadreResult.breakdown.requiredNoticeMonths).toBe(2);
    expect(employeResult.breakdown.requiredNoticeMonths).toBe(1);
    expect(cadreResult.breakdown.noticeCompensationDue).toBeGreaterThan(
      employeResult.breakdown.noticeCompensationDue,
    );
  });
});
