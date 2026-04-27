import { describe, expect, it } from "vitest";
import { simulateDemission } from "@/lib/calculators/demission";

describe("simulateDemission", () => {
  it("computes resignation outcome", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      yearsOfService: 2,
      monthsOfService: 0,
      unusedLeaveDays: 10,
      noticeServed: true,
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.leavePayout).toBeGreaterThan(0);
    expect(result.breakdown.noticeComplianceStatus).toBe("served");
    expect(result.breakdown.netFinancialOutcome).toBeGreaterThan(0);
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
    expect(cadreResult.breakdown.potentialNoticeValue).toBeGreaterThan(
      employeResult.breakdown.potentialNoticeValue,
    );
    expect(cadreResult.breakdown.noticeComplianceStatus).toBe("not_served");
  });

  it("handles zero outcome when notice not served and no leave days", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      yearsOfService: 2,
      monthsOfService: 0,
      unusedLeaveDays: 0,
      noticeServed: false,
    });

    expect(result.breakdown.leavePayout).toBe(0);
    expect(result.breakdown.potentialNoticeValue).toBeGreaterThan(0);
    expect(result.breakdown.netFinancialOutcome).toBe(0); // Never negative
    expect(result.breakdown.noticeComplianceStatus).toBe("not_served");
    expect(result.explanation.warnings).toContain(
      "L'employeur peut engager une action en dommages et intérêts mais ne peut pas retenir le solde de tout compte."
    );
    expect(result.explanation.summary).toContain("Aucun paiement dû");
  });
});
