import { describe, it, expect } from 'vitest';
import { simulatePayrollMass } from './payroll-mass';
import { simulateCompensationOptimization } from './compensation-optimization';

describe('Payroll Mass Calculator', () => {
  it('should handle bulk input (count + average salary)', () => {
    const result = simulatePayrollMass({
      employeeCount: 10,
      averageGrossSalary: 12000,
      calculationDate: "2026-01-01",
      companySize: "large"
    });
    expect(result.employeeCount).toBe(10);
    expect(result.totals.totalGross).toBe(120000);
    expect(result.explanation.summary).toContain("10 employes");
    expect(result.explanation.summary).toContain("120000 MAD");
  });
});

describe('Compensation Optimization Calculator', () => {
  it('should mention totalBudget in the summary', () => {
    const result = simulateCompensationOptimization({
      totalBudget: 20000,
      calculationDate: "2026-01-01",
      salaryOnlyGross: 15000,
      salaryWithBonusGross: 12000,
      annualBonusGross: 36000,
      salaryWithBenefitsGross: 12000,
      benefitsMonthlyValue: 3000
    });
    expect(result.explanation.summary).toContain("budget employeur cible de 20000 MAD");
  });
});
