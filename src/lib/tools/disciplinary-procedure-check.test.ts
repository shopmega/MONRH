import { describe, expect, it } from "vitest";
import { checkDisciplinaryProcedure } from "@/lib/tools/disciplinary-procedure-check";

describe("checkDisciplinaryProcedure", () => {
  it("returns low risk for complete compliant procedure", () => {
    const result = checkDisciplinaryProcedure({
      hasWrittenNotice: true,
      noticeDescribesFacts: true,
      hearingHeld: true,
      hearingNoticeHours: 48,
      employeeCanDefend: true,
      sanctionWithinReasonableDelay: true,
      priorSanctionsDocumented: true,
      hasProofArchive: true,
    });

    expect(result.riskScore).toBe(0);
    expect(result.level).toBe("low");
    expect(result.issues).toHaveLength(0);
  });

  it("returns high risk for major procedural gaps", () => {
    const result = checkDisciplinaryProcedure({
      hasWrittenNotice: false,
      noticeDescribesFacts: false,
      hearingHeld: false,
      hearingNoticeHours: 0,
      employeeCanDefend: false,
      sanctionWithinReasonableDelay: false,
      priorSanctionsDocumented: false,
      hasProofArchive: false,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe("high");
    expect(result.issues.length).toBeGreaterThan(4);
  });
});
