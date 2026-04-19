import { describe, expect, it } from "vitest";
import { buildSimulationResultDocumentLink, buildToolResultDocumentLinks, buildDocumentHref } from "@/lib/tools/result-document-links";

describe("buildDocumentHref", () => {
  it("builds href with query parameters", () => {
    const href = buildDocumentHref("test-template", { 
      amount: 1000, 
      period: "2024-01",
    });
    expect(href).toBe("/documents/test-template?amount=1000&period=2024-01");
  });

  it("builds href without query parameters", () => {
    const href = buildDocumentHref("test-template", {});
    expect(href).toBe("/documents/test-template");
  });

  it("handles boolean values", () => {
    const href = buildDocumentHref("test-template", { 
      active: true, 
      disabled: false 
    });
    expect(href).toBe("/documents/test-template?active=true&disabled=false");
  });
});

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

  it("builds links for final settlement with zero amount", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "final_settlement_audit",
      result: { breakdown: { totalEstimatedDue: 0 } },
    });

    expect(links.length).toBeGreaterThan(0);
    expect(links.some((link) => !link.href.includes("amount_due=0"))).toBe(true);
  });

  it("builds links for disciplinary procedure check", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "disciplinary_procedure_check",
      result: {},
    });

    expect(links).toHaveLength(2);
    expect(links.some((link) => link.templateId === "formal-complaint-employer")).toBe(true);
    expect(links.some((link) => link.templateId === "labor-inspector-complaint")).toBe(true);
  });

  it("builds links for fixed term contract risk", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "fixed_term_contract_risk",
      result: {},
    });

    expect(links).toHaveLength(2);
    expect(links.some((link) => link.templateId === "formal-complaint-employer")).toBe(true);
    expect(links.some((link) => link.templateId === "contract-renewal-request")).toBe(true);
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

  it("handles pre-litigation with no steps", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "pre_litigation_timeline",
      result: { steps: null },
    });

    expect(links).toHaveLength(0);
  });

  it("handles unknown tool id", () => {
    const links = buildToolResultDocumentLinks({
      toolId: "unknown_tool" as "final_settlement_audit" | "disciplinary_procedure_check" | "fixed_term_contract_risk" | "pre_litigation_timeline",
      result: {},
    });

    expect(links).toHaveLength(0);
  });
});

describe("buildSimulationResultDocumentLink", () => {
  it("builds link for licenciement with total and service years", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/licenciement",
      calculatorType: "licenciement",
      title: "Licenciement",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {
          totalEstimated: 15000,
          totalServiceYears: 5,
          dommagesAbusif: true,
        },
      },
    });

    expect(link?.templateId).toBe("labor-inspector-complaint");
    expect(link?.href).toContain("amount_due=15000");
    expect(link?.href).toContain("Licenciement+abusif");
  });

  it("builds link for licenciement without total", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/licenciement",
      calculatorType: "licenciement",
      title: "Licenciement",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {
          totalServiceYears: 3,
        },
      },
    });

    expect(link?.templateId).toBe("labor-inspector-complaint");
    expect(link?.href).toContain("apres+3+an%28s%29");
  });

  it("builds link for unpaid salary recovery", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/recouvrement-salaire-impaye",
      calculatorType: "unpaid_salary_recovery",
      title: "Salaire impaye",
      description: "Recouvrement",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: {
        calculationDate: "2026-03-01",
        unpaidMonths: 2,
      },
      result: {
        versionCode: "ma_2026",
        breakdown: {
          totalClaimAmount: 12000,
        },
      },
    });

    expect(link?.templateId).toBe("salary-recovery-letter");
    expect(link?.href).toContain("amount_due=12000");
    expect(link?.href).toContain("period=Derniers+2+mois");
  });

  it("builds link for overtime recovery", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/heures-supplementaires",
      calculatorType: "unpaid_overtime_recovery",
      title: "Heures sup",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {
          totalClaimAmount: 5000,
        },
      },
    });

    expect(link?.templateId).toBe("overtime-claim-letter");
    expect(link?.href).toContain("amount_due=5000");
  });

  it("builds link for resignation", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/demission",
      calculatorType: "demission",
      title: "Demission",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {
          workerCategory: "cadre",
          leavePayout: 3000,
          noticeCompensationDue: 2000,
        },
      },
    });

    expect(link?.templateId).toBe("resignation-letter");
    expect(link?.href).toContain("amount_due=5000");
    expect(link?.href).toContain("position=cadre");
  });

  it("builds link for harassment scenario", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/harcelement",
      calculatorType: "harassment_scenario",
      title: "Harcelement",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("harassment-report-letter");
    expect(link?.href).toContain("Signalement+de+faits+de+harcelement");
  });

  it("builds link for maternity leave", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/conge-maternite",
      calculatorType: "maternity_leave",
      title: "Maternite",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("maternity-leave-request");
    expect(link?.href).toContain("Conge+maternite+legal");
  });

  it("builds link for work accident", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/accident-travail",
      calculatorType: "work_accident",
      title: "Accident",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("work-accident-declaration");
    expect(link?.href).toContain("Accident+du+travail+survenu");
  });

  it("builds link for leave accrual", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/conges",
      calculatorType: "leave_accrual",
      title: "Conges",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("unpaid-leave-request");
    expect(link?.href).toContain("Demande+de+conge+exceptionnel");
  });

  it("builds link for fin cdd", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/fin-cdd",
      calculatorType: "fin_cdd",
      title: "Fin CDD",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: {},
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("contract-renewal-request");
    expect(link?.href).toContain("Proposition+de+renouvellement+de+contrat");
  });

  it("builds link for probation termination", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/fin-periode-essai",
      calculatorType: "probation_termination",
      title: "Fin periode essai",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: { calculationDate: "2024-01-01" },
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link?.templateId).toBe("notice-letter");
    expect(link?.href).toContain("effective_date=2024-01-01");
  });

  it("returns null for unknown calculator type", () => {
    const link = buildSimulationResultDocumentLink({
      calculatorPath: "/simulateurs/unknown",
      calculatorType: "unknown" as string,
      title: "Unknown",
      description: "Test",
      breakdownLabels: {},
      units: {},
      locale: "fr-MA",
      inputPayload: {},
      result: {
        versionCode: "ma_2026",
        breakdown: {},
      },
    });

    expect(link).toBeNull();
  });
});
