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
});
