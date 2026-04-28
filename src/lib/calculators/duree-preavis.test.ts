import { describe, expect, it } from "vitest";
import { simulateDureePreavis } from "@/lib/calculators/duree-preavis";

describe("simulateDureePreavis", () => {
  it("computes CDI notice by seniority and category", () => {
    const cadreResult = simulateDureePreavis({
      calculationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "cadre",
      yearsOfService: 3,
      monthsOfService: 0,
    });

    const employeResult = simulateDureePreavis({
      calculationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 3,
      monthsOfService: 0,
    });

    expect(cadreResult.versionCode).toBe("ma_2026");
    expect(cadreResult.breakdown.requiredNoticeMonths).toBe(2);
    expect(cadreResult.breakdown.requiredNoticeDays).toBe(60);
    expect(employeResult.breakdown.requiredNoticeMonths).toBe(1);
    expect(cadreResult.breakdown.serviceInputMode).toBe("manual");
  });

  it("computes CDD notice in days", () => {
    const result = simulateDureePreavis({
      calculationDate: "2026-02-12",
      contractType: "CDD",
      workerCategory: "cadre",
      yearsOfService: 1,
      monthsOfService: 0,
    });

    expect(result.breakdown.requiredNoticeMonths).toBe(0);
    expect(result.breakdown.requiredNoticeDays).toBe(15);
  });

  it("uses hire date when both hire date and manual seniority are present", () => {
    const result = simulateDureePreavis({
      calculationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "employe",
      hireDate: "2020-02-12",
      yearsOfService: 1,
      monthsOfService: 0,
    });

    expect(result.breakdown.serviceInputMode).toBe("hire_date");
    expect(result.breakdown.totalServiceYears).toBe(6);
    expect(result.breakdown.requiredNoticeMonths).toBe(2);
  });
});
