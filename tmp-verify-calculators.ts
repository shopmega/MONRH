import { simulatePayrollMass } from './src/lib/calculators/payroll-mass';
import { simulateCompensationOptimization } from './src/lib/calculators/compensation-optimization';

console.log("--- Testing Payroll Mass (Bulk) ---");
const payrollResult = simulatePayrollMass({
  employeeCount: 10,
  averageGrossSalary: 12000,
  calculationDate: "2026-01-01",
  companySize: "large"
});
console.log("Employee Count:", payrollResult.employeeCount);
console.log("Total Gross:", payrollResult.totals.totalGross);
console.log("Total Employer Cost:", payrollResult.totals.totalEmployerCost);
console.log("Summary:", payrollResult.explanation.summary);

console.log("\n--- Testing Compensation Optimization (Budget) ---");
const compResult = simulateCompensationOptimization({
  totalBudget: 20000,
  calculationDate: "2026-01-01",
  salaryOnlyGross: 15000,
  salaryWithBonusGross: 12000,
  annualBonusGross: 36000,
  salaryWithBenefitsGross: 12000,
  benefitsMonthlyValue: 3000
});
console.log("Summary:", compResult.explanation.summary);
