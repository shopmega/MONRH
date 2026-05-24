import { generatePayslip } from "@/lib/calculators/payslip";
import type {
  EmployerCnssExport,
  EmployerCnssRow,
  EmployerEmployee,
  EmployerPayrollPayElement,
  EmployerPayrollResult,
  EmployerPayrollRun,
} from "@/lib/employer/portal-data";
import { listEmployerEmployees, listEmployerPayrollRuns } from "@/lib/server/employer-core-store";

const MONEY_TOLERANCE = 0.05;
const DEFAULT_CNSS_DECLARED_DAYS = 26;

export class EmployerPayrollValidationError extends Error {
  code: string;

  constructor(code: string, message = code) {
    super(message);
    this.code = code;
  }
}

export function isEmployerPayrollValidationError(error: unknown): error is EmployerPayrollValidationError {
  return error instanceof EmployerPayrollValidationError;
}

function money(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function closeEnough(left: number | undefined, right: number | undefined) {
  return Math.abs(money(left) - money(right)) <= MONEY_TOLERANCE;
}

function normalizePayElements(payElements: EmployerPayrollPayElement[] | undefined): EmployerPayrollPayElement[] {
  return (payElements ?? [])
    .map((item) => ({
      label: item.label.trim(),
      amount: money(item.amount),
      category: item.category,
      taxable: Boolean(item.taxable),
      cnssSubject: Boolean(item.cnssSubject),
      amoSubject: Boolean(item.amoSubject),
    }))
    .filter((item) => item.label && item.amount > 0);
}

function payrollResultsMatch(actual: EmployerPayrollResult, expected: EmployerPayrollResult) {
  return [
    closeEnough(actual.earnings.baseSalary, expected.earnings.baseSalary),
    closeEnough(actual.earnings.overtimePay, expected.earnings.overtimePay),
    closeEnough(actual.earnings.bonus, expected.earnings.bonus),
    closeEnough(actual.earnings.allowances, expected.earnings.allowances),
    closeEnough(actual.earnings.totalGross, expected.earnings.totalGross),
    closeEnough(actual.deductions.cnssEmployeeShortTerm, expected.deductions.cnssEmployeeShortTerm),
    closeEnough(actual.deductions.cnssEmployeeLongTerm, expected.deductions.cnssEmployeeLongTerm),
    closeEnough(actual.deductions.cnssEmployee, expected.deductions.cnssEmployee),
    closeEnough(actual.deductions.amoEmployee, expected.deductions.amoEmployee),
    closeEnough(actual.deductions.cimrEmployee, expected.deductions.cimrEmployee),
    closeEnough(actual.deductions.taxableIncome, expected.deductions.taxableIncome),
    closeEnough(actual.deductions.familyTaxReduction, expected.deductions.familyTaxReduction),
    closeEnough(actual.deductions.incomeTax, expected.deductions.incomeTax),
    closeEnough(actual.deductions.totalDeductions, expected.deductions.totalDeductions),
    closeEnough(actual.netToPay, expected.netToPay),
    closeEnough(actual.employerContributions.cnssEmployerShortTerm, expected.employerContributions.cnssEmployerShortTerm),
    closeEnough(actual.employerContributions.cnssEmployerLongTerm, expected.employerContributions.cnssEmployerLongTerm),
    closeEnough(actual.employerContributions.cnssEmployer, expected.employerContributions.cnssEmployer),
    closeEnough(actual.employerContributions.familyAllowanceEmployer, expected.employerContributions.familyAllowanceEmployer),
    closeEnough(actual.employerContributions.amoEmployer, expected.employerContributions.amoEmployer),
    closeEnough(actual.employerContributions.formationPro, expected.employerContributions.formationPro),
    closeEnough(actual.employerContributions.totalEmployerCost, expected.employerContributions.totalEmployerCost),
  ].every(Boolean);
}

function generateCanonicalPayrollResults(
  companyId: string,
  employee: EmployerEmployee,
  period: string,
  submitted: EmployerPayrollResult,
  payElements?: EmployerPayrollPayElement[],
) {
  const includeCimrCandidates = money(submitted.deductions.cimrEmployee) > 0 ? [true] : [false, true];
  const companySizeCandidates: Array<"small" | "large"> = ["small", "large"];
  const canonicalPayElements = normalizePayElements(payElements);
  const hasStructuredPayElements = canonicalPayElements.length > 0;

  return includeCimrCandidates.flatMap((includeCimr) =>
    companySizeCandidates.map((companySize) =>
      generatePayslip({
        employeeName: employee.fullName,
        employerId: companyId,
        period,
        grossSalary: employee.grossSalary,
        familyDependentsCount: employee.childrenCount ?? 0,
        overtimePay: hasStructuredPayElements ? 0 : money(submitted.earnings.overtimePay),
        bonus: hasStructuredPayElements ? 0 : money(submitted.earnings.bonus),
        allowances: hasStructuredPayElements ? 0 : money(submitted.earnings.allowances),
        payElements: canonicalPayElements,
        includeCimr,
        companySize,
        calculationDate: submitted.calculationDate,
      }),
    ),
  );
}

export function canonicalizeEmployerPayrollRun(
  companyId: string,
  employees: EmployerEmployee[],
  run: EmployerPayrollRun,
): EmployerPayrollRun {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  return {
    ...run,
    lines: run.lines.map((line) => {
      const employee = employeesById.get(line.employeeId);
      if (!employee) {
        throw new EmployerPayrollValidationError("payroll_employee_not_found", `Unknown employee: ${line.employeeId}`);
      }
      if (line.result.period !== run.period) {
        throw new EmployerPayrollValidationError("payroll_period_mismatch", `Payroll period mismatch: ${line.employeeId}`);
      }

      const canonicalPayElements = normalizePayElements(line.payElements);
      const canonical = generateCanonicalPayrollResults(companyId, employee, run.period, line.result, canonicalPayElements).find(
        (result) => payrollResultsMatch(line.result, result),
      );
      if (!canonical) {
        throw new EmployerPayrollValidationError(
          "payroll_result_mismatch",
          `Payroll result does not match calculator output: ${employee.fullName}`,
        );
      }

      return {
        employeeId: employee.id,
        employeeName: employee.fullName,
        payElements: canonicalPayElements,
        result: canonical,
      };
    }),
  };
}

export async function canonicalizeEmployerPayrollRunsForCompany(
  userId: string,
  companyId: string,
  runs: EmployerPayrollRun[],
) {
  const employees = await listEmployerEmployees(userId, companyId);
  return runs.map((run) => canonicalizeEmployerPayrollRun(companyId, employees, run));
}

function declaredDaysByEmployee(rows: EmployerCnssRow[] | undefined) {
  return new Map(
    (rows ?? []).map((row) => [
      row.employeeId,
      Math.min(31, Math.max(0, Math.round(Number.isFinite(row.declaredDays) ? row.declaredDays : DEFAULT_CNSS_DECLARED_DAYS))),
    ]),
  );
}

function buildCnssRowsFromRun(
  run: EmployerPayrollRun,
  employees: EmployerEmployee[],
  submittedRows?: EmployerCnssRow[],
): EmployerCnssRow[] {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const submittedDeclaredDays = declaredDaysByEmployee(submittedRows);
  return run.lines.map((line) => {
    const employee = employeesById.get(line.employeeId);
    if (!employee) {
      throw new EmployerPayrollValidationError("cnss_employee_not_found", `Unknown employee: ${line.employeeId}`);
    }
    const cnssEmployee = line.result.deductions.cnssEmployee;
    const cnssEmployer = line.result.employerContributions.cnssEmployer;
    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeCin: employee.cin ?? "",
      cnssNumber: employee.cnssNumber,
      contractType: employee.contractType,
      gross: line.result.earnings.totalGross,
      declaredDays: submittedDeclaredDays.get(employee.id) ?? DEFAULT_CNSS_DECLARED_DAYS,
      cnssBase: Math.min(line.result.earnings.totalGross, 6000),
      cnssEmployee,
      cnssEmployer,
      totalCnss: cnssEmployee + cnssEmployer,
    };
  });
}

function buildCnssTotals(rows: EmployerCnssRow[]): EmployerCnssExport["totals"] {
  return {
    employees: rows.length,
    gross: rows.reduce((sum, row) => sum + row.gross, 0),
    cnssBase: rows.reduce((sum, row) => sum + row.cnssBase, 0),
    cnssEmployee: rows.reduce((sum, row) => sum + row.cnssEmployee, 0),
    cnssEmployer: rows.reduce((sum, row) => sum + row.cnssEmployer, 0),
    totalCnss: rows.reduce((sum, row) => sum + row.totalCnss, 0),
    missingCnss: rows.filter((row) => !row.cnssNumber.trim() || row.cnssNumber === "A completer").length,
  };
}

export async function canonicalizeEmployerCnssExportsForCompany(
  userId: string,
  companyId: string,
  exports: EmployerCnssExport[],
) {
  const [employees, payrollRuns] = await Promise.all([
    listEmployerEmployees(userId, companyId),
    listEmployerPayrollRuns(userId, companyId),
  ]);
  const runsById = new Map(payrollRuns.map((run) => [run.id, run]));

  return exports.map((item) => {
    if (!item.payrollRunId) {
      throw new EmployerPayrollValidationError("cnss_payroll_run_required");
    }
    const run = runsById.get(item.payrollRunId);
    if (!run) {
      throw new EmployerPayrollValidationError("cnss_payroll_run_not_found", `Unknown payroll run: ${item.payrollRunId}`);
    }
    const rows = buildCnssRowsFromRun(run, employees, item.rows);
    return {
      ...item,
      period: run.period,
      rows,
      totals: buildCnssTotals(rows),
    };
  });
}

export async function canonicalizePayslipPdfResult(
  userId: string,
  companyId: string,
  employeeId: string,
  period: string,
  submitted: EmployerPayrollResult,
  payElements?: EmployerPayrollPayElement[],
) {
  const employees = await listEmployerEmployees(userId, companyId);
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new EmployerPayrollValidationError("payslip_employee_not_found", `Unknown employee: ${employeeId}`);
  }

  const result = generateCanonicalPayrollResults(companyId, employee, period, submitted, payElements).find((candidate) =>
    payrollResultsMatch(submitted, candidate),
  );
  if (!result) {
    throw new EmployerPayrollValidationError("payslip_result_mismatch");
  }

  const payrollRuns = await listEmployerPayrollRuns(userId, companyId);
  const year = new Date(result.calculationDate).getFullYear();
  const annualTotals = payrollRuns
    .flatMap((run) => run.lines)
    .filter((line) => line.employeeId === employee.id)
    .filter((line) => {
      const parsed = line.result.calculationDate ? new Date(line.result.calculationDate) : null;
      return parsed && !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === year;
    })
    .reduce(
      (totals, line) => ({
        incomeTax: totals.incomeTax + line.result.deductions.incomeTax,
        cnssEmployee: totals.cnssEmployee + line.result.deductions.cnssEmployee,
      }),
      { incomeTax: 0, cnssEmployee: 0 },
    );

  return { employee, result, annualTotals };
}
