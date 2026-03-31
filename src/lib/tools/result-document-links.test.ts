import { describe, expect, it } from "vitest";
import { buildToolResultDocumentLinks } from "@/lib/tools/result-document-links";

describe("buildToolResultDocumentLinks", () => {
  it("builds prefilled links for final settlement results", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "final_settlement_audit",
      result: { breakdown: { totalEstimatedDue: 18000 } },
    });

    expect(links.length).toBeGreaterThan(0);
    expect(links.some((link) => link.href.includes("/documents/salary-recovery-letter"))).toBe(true);
    expect(links.some((link) => link.href.includes("amount_due=18000"))).toBe(true);
  });

  it("extracts unique links from pre-litigation steps", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "pre_litigation_timeline",
      result: {
        steps: [
          {
            documentTemplateId: "labor-inspector-complaint",
            documentHref: "/documents/labor-inspector-complaint?issue_summary=test",
          },
          {
            documentTemplateId: "labor-inspector-complaint",
            documentHref: "/documents/labor-inspector-complaint?issue_summary=test",
          },
        ],
      },
    });

    expect(links).toHaveLength(1);
  });
});
