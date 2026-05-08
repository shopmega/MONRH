import { describe, expect, it } from "vitest";
import { dureePreavisInputSchema, simulateDureePreavis } from "@/lib/calculators/duree-preavis";

describe("simulateDureePreavis", () => {
  it("computes CDI notice by hire date, seniority boundary and category", () => {
    const lessThanOneYear = simulateDureePreavis({
      calculationDate: "2026-02-12",
      notificationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "employe",
      hireDate: "2025-08-12",
    });
    const cadreOneToFive = simulateDureePreavis({
      calculationDate: "2026-02-12",
      notificationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "cadre",
      hireDate: "2023-02-12",
    });
    const employeFivePlus = simulateDureePreavis({
      calculationDate: "2026-02-12",
      notificationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "employe",
      hireDate: "2020-02-12",
    });

    expect(lessThanOneYear.breakdown.requiredNoticeDays).toBe(8);
    expect(cadreOneToFive.breakdown.requiredNoticeMonths).toBe(2);
    expect(employeFivePlus.breakdown.requiredNoticeMonths).toBe(2);
    expect(cadreOneToFive.breakdown.serviceInputMode).toBe("hire_date");
  });

  it("rejects conflicting hire date and manual seniority", () => {
    expect(() =>
      dureePreavisInputSchema.parse({
        calculationDate: "2026-02-12",
        contractType: "CDI",
        workerCategory: "employe",
        hireDate: "2020-02-12",
        yearsOfService: 1,
      }),
    ).toThrow(/Conflicting inputs/);
  });

  it("keeps legacy manual seniority only when hire date is absent", () => {
    const result = simulateDureePreavis({
      calculationDate: "2026-02-12",
      contractType: "CDI",
      workerCategory: "employe",
      yearsOfService: 3,
      monthsOfService: 0,
    });

    expect(result.inputMode).toBe("manual_unknown_hire_date");
    expect(result.breakdown.totalServiceYears).toBe(3);
  });

  it("does not compute CDI-style notice for CDD", () => {
    const result = simulateDureePreavis({
      calculationDate: "2026-02-12",
      notificationDate: "2026-02-12",
      contractType: "CDD",
      workerCategory: "cadre",
      hireDate: "2025-02-12",
      cddRuptureReason: "early_unilateral_employee",
    });

    expect(result.breakdown.requiredNoticeMonths).toBe(0);
    expect(result.breakdown.requiredNoticeDays).toBe(0);
    expect(result.breakdown.noticeLegalStatus).toBe("cdd_requires_rupture_basis");
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });
});
