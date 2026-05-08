import { describe, expect, it } from "vitest";
import { simulateSalaryIncrease, salaryIncreaseInputSchema } from "./salary-increase";

describe("simulateSalaryIncrease", () => {
  it("calculates basic salary increase without CIMR", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.currentGross).toBe(10000);
    expect(result.newGross).toBe(12000);
    expect(result.rawIncreasePercent).toBe(20);
    expect(result.current.net).toBeGreaterThan(0);
    expect(result.proposed.net).toBeGreaterThan(result.current.net);
    expect(result.netGain.monthly).toBeGreaterThan(0);
    expect(result.netGain.annual).toBe(result.netGain.monthly * 12);
    expect(result.netGain.realIncreasePercent).toBeLessThan(result.rawIncreasePercent);
    expect(result.explanation.summary).toContain("20%");
    expect(result.explanation.warnings).toHaveLength(3);
    expect(result.explanation.nextSteps).toHaveLength(3);
  });

  it("calculates salary increase with CIMR", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2026-01-01",
      includeCimr: true,
      cimrRate: 0.06,
    });

    expect(result.current.cimrEmployee).toBeGreaterThan(0);
    expect(result.proposed.cimrEmployee).toBeGreaterThan(result.current.cimrEmployee);
    expect(result.current.net).toBeLessThan(10000);
    expect(result.proposed.net).toBeLessThan(12000);
  });

  it("handles small salary increase", () => {
    const result = simulateSalaryIncrease({
      currentGross: 8000,
      newGross: 8500,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.rawIncreasePercent).toBe(6.25);
    expect(result.netGain.monthly).toBeGreaterThan(0);
    expect(result.netGain.realIncreasePercent).toBeLessThan(result.rawIncreasePercent);
  });

  it("handles large salary increase", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 20000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.rawIncreasePercent).toBe(100);
    expect(result.netGain.monthly).toBeGreaterThan(0);
    expect(result.netGain.realIncreasePercent).toBeLessThan(result.rawIncreasePercent);
    expect(result.explanation.warnings.length).toBeGreaterThan(0);
  });

  it("calculates employer cost impact", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.current.employerTotalCost).toBeGreaterThan(result.currentGross);
    expect(result.proposed.employerTotalCost).toBeGreaterThan(result.proposed.net);
    expect(result.netGain.employerCostDelta).toBeGreaterThan(0);
  });

  it("validates input schema", () => {
    expect(() => {
      salaryIncreaseInputSchema.parse({
        currentGross: -1000,
        newGross: 12000,
      });
    }).toThrow();

    expect(() => {
      salaryIncreaseInputSchema.parse({
        currentGross: 10000,
        newGross: -5000,
      });
    }).toThrow();

    expect(() => {
      salaryIncreaseInputSchema.parse({
        currentGross: 10000,
        newGross: 12000,
        cimrRate: 0.15, // Above max 0.12
      });
    }).toThrow();
  });

  it("uses default values", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.calculationDate).toBe("2026-01-01");
    expect(result.current.cimrEmployee).toBe(0);
    expect(result.proposed.cimrEmployee).toBe(0);
  });

  it("handles edge case with minimal increase", () => {
    const result = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 10100,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.rawIncreasePercent).toBe(1);
    expect(result.netGain.monthly).toBeGreaterThan(0);
    expect(result.netGain.realIncreasePercent).toBeGreaterThan(0);
  });

  it("provides appropriate warnings for high tax bracket impact", () => {
    const result = simulateSalaryIncrease({
      currentGross: 30000,
      newGross: 45000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result.explanation.warnings.length).toBeGreaterThan(0);
  });

  it("calculates all financial components correctly", () => {
    const result = simulateSalaryIncrease({
      currentGross: 15000,
      newGross: 18000,
      calculationDate: "2026-01-01",
      includeCimr: true,
      cimrRate: 0.06,
    });

    // Current salary components
    expect(result.current.cnssEmployee).toBeGreaterThan(0);
    expect(result.current.amoEmployee).toBeGreaterThan(0);
    expect(result.current.cimrEmployee).toBeGreaterThan(0);
    expect(result.current.incomeTax).toBeGreaterThan(0);
    expect(result.current.employerTotalCost).toBeGreaterThan(result.currentGross);

    // Proposed salary components
    expect(result.proposed.cnssEmployee).toBeGreaterThan(0);
    expect(result.proposed.amoEmployee).toBeGreaterThan(0);
    expect(result.proposed.cimrEmployee).toBeGreaterThan(0);
    expect(result.proposed.incomeTax).toBeGreaterThan(0);
    expect(result.proposed.employerTotalCost).toBeGreaterThan(result.newGross);

    // Net gain calculations
    expect(result.netGain.monthly).toBeCloseTo(result.proposed.net - result.current.net, 2);
    expect(result.netGain.annual).toBeCloseTo(result.netGain.monthly * 12, 2);
    expect(result.netGain.employerCostDelta).toBeCloseTo(
      result.proposed.employerTotalCost - result.current.employerTotalCost
    );
  });

  it("handles different calculation dates", () => {
    const result2024 = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2024-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    const result2026 = simulateSalaryIncrease({
      currentGross: 10000,
      newGross: 12000,
      calculationDate: "2026-01-01",
      includeCimr: false,
      cimrRate: 0.06,
    });

    expect(result2024.calculationDate).toBe("2024-01-01");
    expect(result2026.calculationDate).toBe("2026-01-01");
    // Different years might have different tax rules
    expect(result2024.current.net).toBeGreaterThan(0);
    expect(result2026.current.net).toBeGreaterThan(0);
  });
});
