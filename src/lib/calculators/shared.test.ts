import { describe, expect, it } from "vitest";
import { roundMAD, tenureToNoticeMonths, type CalculatorExplanation } from "@/lib/calculators/shared";

describe("roundMAD", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundMAD(123.456)).toBe(123.46);
    expect(roundMAD(123.454)).toBe(123.45);
    expect(roundMAD(123.455)).toBe(123.46);
  });

  it("handles whole numbers", () => {
    expect(roundMAD(100)).toBe(100);
    expect(roundMAD(0)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(roundMAD(-123.456)).toBe(-123.46);
    expect(roundMAD(-123.454)).toBe(-123.45);
  });

  it("handles very small numbers", () => {
    expect(roundMAD(0.001)).toBe(0);
    expect(roundMAD(0.004)).toBe(0);
    expect(roundMAD(0.005)).toBe(0.01);
  });

  it("handles very large numbers", () => {
    expect(roundMAD(999999.999)).toBe(1000000);
    expect(roundMAD(1234567.891)).toBe(1234567.89);
  });
});

describe("tenureToNoticeMonths", () => {
  it("returns 1 month for less than 1 year", () => {
    expect(tenureToNoticeMonths(0)).toBe(1);
    expect(tenureToNoticeMonths(0.5)).toBe(1);
    expect(tenureToNoticeMonths(0.99)).toBe(1);
  });

  it("returns 2 months for 1-4 years", () => {
    expect(tenureToNoticeMonths(1)).toBe(2);
    expect(tenureToNoticeMonths(2.5)).toBe(2);
    expect(tenureToNoticeMonths(4)).toBe(2);
    expect(tenureToNoticeMonths(4.99)).toBe(2);
  });

  it("returns 3 months for 5+ years", () => {
    expect(tenureToNoticeMonths(5)).toBe(3);
    expect(tenureToNoticeMonths(10)).toBe(3);
    expect(tenureToNoticeMonths(25)).toBe(3);
  });

  it("handles edge cases", () => {
    expect(tenureToNoticeMonths(-1)).toBe(1);
    expect(tenureToNoticeMonths(Infinity)).toBe(3);
    expect(tenureToNoticeMonths(NaN)).toBe(3);
  });
});

describe("CalculatorExplanation type", () => {
  it("accepts valid explanation object", () => {
    const explanation: CalculatorExplanation = {
      summary: "Test summary",
      assumptions: ["Assumption 1", "Assumption 2"],
      formulas: ["Formula 1"],
      warnings: ["Warning 1"],
      nextSteps: ["Step 1"],
      confidence: {
        level: "high",
        label: "High confidence",
        note: "Based on current regulations",
      },
      sources: ["Source 1"],
      missingInformation: ["Missing info"],
    };

    expect(explanation.summary).toBe("Test summary");
    expect(explanation.confidence?.level).toBe("high");
  });

  it("accepts minimal explanation object", () => {
    const explanation: CalculatorExplanation = {
      summary: "Minimal summary",
      assumptions: [],
      formulas: [],
      warnings: [],
      nextSteps: [],
    };

    expect(explanation.summary).toBe("Minimal summary");
    expect(explanation.confidence).toBeUndefined();
  });

  it("accepts explanation with optional confidence", () => {
    const explanation: CalculatorExplanation = {
      summary: "Test summary",
      assumptions: [],
      formulas: [],
      warnings: [],
      nextSteps: [],
      confidence: {
        level: "medium",
        note: "Some uncertainty",
      },
    };

    expect(explanation.confidence?.level).toBe("medium");
    expect(explanation.confidence?.label).toBeUndefined();
  });
});
