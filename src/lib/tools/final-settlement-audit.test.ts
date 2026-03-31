import { describe, expect, it } from "vitest";
import { auditFinalSettlement } from "@/lib/tools/final-settlement-audit";

describe("auditFinalSettlement", () => {
  it("computes a full settlement estimate with arrears", () => {
    const result = auditFinalSettlement({
      calculationDate: "2026-02-12",
      monthlySalary: 9000,
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 4,
      monthsOfService: 0,
      unusedLeaveDays: 12,
      unpaidSalaryMonths: 2,
      overtimeDueMad: 1200,
      noticeAlreadyPaid: false,
      abusiveDismissal: false,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.totalEstimatedDue).toBeGreaterThan(0);
    expect(result.breakdown.salaryArrears).toBe(18000);
    expect(result.issues.find((issue) => issue.code === "UNPAID_SALARY")).toBeTruthy();
  });

  it("keeps abusive damages at zero for non-abusive scenario", () => {
    const result = auditFinalSettlement({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 8,
      monthsOfService: 0,
      unusedLeaveDays: 0,
      unpaidSalaryMonths: 0,
      overtimeDueMad: 0,
      noticeAlreadyPaid: true,
      abusiveDismissal: false,
    });

    expect(result.breakdown.dommagesAbusif).toBe(0);
    expect(result.issues.find((issue) => issue.code === "ABUSIVE_DISMISSAL_RISK")).toBeFalsy();
  });
});
