import { describe, expect, it } from "vitest";
import { buildPreLitigationTimeline } from "@/lib/tools/pre-litigation-timeline";

describe("buildPreLitigationTimeline", () => {
  it("returns timeline steps with document links", () => {
    const result = buildPreLitigationTimeline(
      {
        incidentDate: "2026-01-01",
        scenario: "unpaid_salary",
        internalResolutionAttempted: false,
        evidenceReady: false,
        urgentFinancialPressure: false,
      },
      "2026-02-01",
    );

    expect(result.steps.length).toBeGreaterThanOrEqual(4);
    expect(result.steps.some((step) => step.documentTemplateId === "salary-recovery-letter")).toBe(
      true,
    );
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it("reduces risk when evidence and internal attempts already exist", () => {
    const result = buildPreLitigationTimeline(
      {
        incidentDate: "2026-02-10",
        scenario: "salary_delay",
        internalResolutionAttempted: true,
        evidenceReady: true,
        urgentFinancialPressure: false,
      },
      "2026-02-12",
    );

    expect(result.riskScore).toBeLessThan(40);
    expect(result.level).toBe("low");
  });
});
