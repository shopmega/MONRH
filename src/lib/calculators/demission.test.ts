import { describe, expect, it } from "vitest";
import { demissionInputSchema, simulateDemission } from "@/lib/calculators/demission";

describe("simulateDemission", () => {
  it("computes resignation outcome from hire date and notification date", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      resignationNotificationDate: "2026-02-15",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      hireDate: "2024-02-15",
      unusedLeaveDays: 10,
      noticeStatus: "served",
    });

    expect(result.versionCode).toBe("ma_2026");
    expect(result.breakdown.leavePayout).toBeGreaterThan(0);
    expect(result.breakdown.noticeComplianceStatus).toBe("served");
    expect(result.breakdown.recommendedDepartureDate).toBe("2026-03-15");
    expect(result.breakdown.netFinancialOutcome).toBeGreaterThan(0);
  });

  it("applies category-specific notice for CDI resignation", () => {
    const cadreResult = simulateDemission({
      calculationDate: "2026-02-12",
      resignationNotificationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "cadre",
      contractType: "CDI",
      hireDate: "2023-02-12",
      unusedLeaveDays: 0,
      noticeStatus: "not_served",
    });

    const employeResult = simulateDemission({
      calculationDate: "2026-02-12",
      resignationNotificationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      hireDate: "2023-02-12",
      unusedLeaveDays: 0,
      noticeStatus: "not_served",
    });

    expect(cadreResult.breakdown.requiredNoticeMonths).toBe(2);
    expect(employeResult.breakdown.requiredNoticeMonths).toBe(1);
    expect(cadreResult.breakdown.potentialNoticeValue).toBeGreaterThan(
      employeResult.breakdown.potentialNoticeValue,
    );
    expect(cadreResult.breakdown.noticeComplianceStatus).toBe("not_served");
  });

  it("rejects hire date with manual seniority", () => {
    expect(() =>
      demissionInputSchema.parse({
        calculationDate: "2026-02-12",
        monthlySalary: 8000,
        workerCategory: "employe",
        contractType: "CDI",
        hireDate: "2020-02-12",
        yearsOfService: 2,
      }),
    ).toThrow(/Conflicting inputs/);
  });

  it("shows a potential amount due to the employer when CDI notice is not served", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      resignationNotificationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "employe",
      contractType: "CDI",
      hireDate: "2024-02-12",
      unusedLeaveDays: 0,
      noticeStatus: "not_served",
    });

    expect(result.breakdown.leavePayout).toBe(0);
    expect(result.breakdown.potentialNoticeValue).toBeGreaterThan(0);
    expect(result.breakdown.amountPotentiallyDueToEmployer).toBe(result.breakdown.potentialNoticeValue);
    expect(result.breakdown.netFinancialOutcome).toBeLessThan(0);
    expect(result.explanation.warnings).toContain(
      "L'employeur peut engager une action en dommages et interets mais ne peut pas retenir le solde de tout compte.",
    );
    expect(result.explanation.summary).toContain("Montant potentiellement du a l'employeur");
  });

  it("does not compute CDI-style notice for CDD resignation", () => {
    const result = simulateDemission({
      calculationDate: "2026-02-12",
      resignationNotificationDate: "2026-02-12",
      monthlySalary: 8000,
      workerCategory: "cadre",
      contractType: "CDD",
      hireDate: "2025-02-12",
      unusedLeaveDays: 0,
      noticeStatus: "not_served",
      cddRuptureReason: "early_unilateral_employee",
    });

    expect(result.breakdown.requiredNoticeMonths).toBe(0);
    expect(result.breakdown.requiredNoticeDays).toBe(0);
    expect(result.breakdown.potentialNoticeValue).toBe(0);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });
});
