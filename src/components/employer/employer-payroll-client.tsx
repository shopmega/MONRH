"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Download, FileText, Loader2, Lock, Search, ShieldCheck } from "lucide-react";
import {
  defaultEmployerPayrollSettings,
  employerPlanCapabilities,
  employerPlanLabels,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollPayElement,
  type EmployerPayrollResult,
  type EmployerPayrollRun,
  type EmployerPayrollLine,
  type EmployerPayrollSettings,
  type EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import {
  getActiveEmployerCompany,
  readEmployerCompanies,
} from "@/lib/employer/company-store";
import { readEmployerEmployees } from "@/lib/employer/employee-store";
import {
  fetchEmployerPayrollRunsFromCloud,
  readEmployerPayrollRuns,
  saveEmployerPayrollRunToCloud,
  writeEmployerPayrollRuns,
} from "@/lib/employer/payroll-store";
import { readEmployerLeaveRequests } from "@/lib/employer/leave-store";
import { readEmployerTimeEntries } from "@/lib/employer/time-store";
import { readEmployerPayrollSettings } from "@/lib/employer/payroll-settings-store";
import { withAudienceQuery } from "@/lib/audience/audience-mode";

type EmployeeVariableState = {
  rubricAmounts: Record<string, string>;
};

function defaultPeriod() {
  return new Intl.DateTimeFormat("fr-MA", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getEmployeeForLine(line: EmployerPayrollLine, employees: EmployerEmployee[]) {
  return employees.find((employee) => employee.id === line.employeeId);
}

function getFilenameFromDisposition(value: string | null) {
  const match = value?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? "bulletin-paie.pdf";
}

function resultYear(result: EmployerPayrollResult) {
  const parsed = result.calculationDate ? new Date(result.calculationDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
}

function getAnnualPayslipTotals(line: EmployerPayrollLine, runs: EmployerPayrollRun[]) {
  const latestLineByPeriod = new Map<string, EmployerPayrollLine>();
  for (const run of [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (latestLineByPeriod.has(run.period)) continue;
    const employeeLine = run.lines.find((item) => item.employeeId === line.employeeId);
    if (employeeLine) latestLineByPeriod.set(run.period, employeeLine);
  }
  if (!latestLineByPeriod.has(line.result.period)) latestLineByPeriod.set(line.result.period, line);

  const year = resultYear(line.result);
  return Array.from(latestLineByPeriod.values())
    .filter((item) => resultYear(item.result) === year)
    .reduce(
      (totals, item) => ({
        incomeTax: totals.incomeTax + item.result.deductions.incomeTax,
        cnssEmployee: totals.cnssEmployee + item.result.deductions.cnssEmployee,
      }),
      { incomeTax: 0, cnssEmployee: 0 },
    );
}

function currentDateISO() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizePeriod(value: string) {
  return value.trim().toLocaleLowerCase("fr-MA").replace(/\s+/g, " ");
}

function timeEntryPeriod(entry: EmployerTimeEntry) {
  const weekStart = new Date(entry.weekStart);
  if (Number.isNaN(weekStart.getTime())) return "";
  return normalizePeriod(
    new Intl.DateTimeFormat("fr-MA", {
      month: "long",
      year: "numeric",
    }).format(weekStart),
  );
}

function datePeriod(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return normalizePeriod(
    new Intl.DateTimeFormat("fr-MA", {
      month: "long",
      year: "numeric",
    }).format(parsed),
  );
}

function leaveTouchesPeriod(request: EmployerLeaveRequest, period: string) {
  return datePeriod(request.startDate) === period || datePeriod(request.endDate) === period;
}

function replacePayrollRunInList(runs: EmployerPayrollRun[], run: EmployerPayrollRun) {
  return runs.some((item) => item.id === run.id)
    ? runs.map((item) => (item.id === run.id ? run : item))
    : [run, ...runs];
}

export function EmployerPayrollClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<EmployerTimeEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [period, setPeriod] = useState(defaultPeriod);
  const [companySize, setCompanySize] = useState<"small" | "large">("small");
  const [includeCimr, setIncludeCimr] = useState(false);
  const [overtimePay, setOvertimePay] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [allowances, setAllowances] = useState("0");
  const [payrollSettings, setPayrollSettings] = useState<EmployerPayrollSettings>(defaultEmployerPayrollSettings);
  const [employeeVariables, setEmployeeVariables] = useState<Record<string, EmployeeVariableState>>({});
  const [query, setQuery] = useState("");
  const [currentRun, setCurrentRun] = useState<EmployerPayrollRun | null>(null);
  const [runs, setRuns] = useState<EmployerPayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedEmployees = readEmployerEmployees();
    const nextEmployees = storedEmployees ?? [];
    const nextCompanies = readEmployerCompanies();
    const nextActiveCompany = getActiveEmployerCompany(nextCompanies);
    const nextRuns = readEmployerPayrollRuns();
    const nextLeaveRequests = readEmployerLeaveRequests() ?? [];
    const nextTimeEntries = readEmployerTimeEntries() ?? [];
    const payrollSettings = readEmployerPayrollSettings();
    setEmployees(nextEmployees);
    setActiveCompany(nextActiveCompany);
    setLeaveRequests(nextLeaveRequests);
    setTimeEntries(nextTimeEntries);
    setCompanySize(payrollSettings.defaultCompanySize);
    setIncludeCimr(payrollSettings.includeCimrByDefault);
    setPayrollSettings(payrollSettings);
    setEmployeeVariables(
      nextEmployees.reduce<Record<string, EmployeeVariableState>>((acc, employee) => {
        acc[employee.id] = { rubricAmounts: {} };
        return acc;
      }, {}),
    );
    setSelectedIds(new Set(nextEmployees.filter((employee) => employee.status === "Actif").map((employee) => employee.id)));
    setRuns(nextRuns);
    setCurrentRun(nextRuns[0] ?? null);
    if (!nextActiveCompany) return;

    let cancelled = false;
    fetchEmployerPayrollRunsFromCloud(nextActiveCompany.id)
      .then((cloudRuns) => {
        if (cancelled || !cloudRuns) return;
        setRuns(cloudRuns);
        setCurrentRun(cloudRuns[0] ?? null);
        writeEmployerPayrollRuns(cloudRuns);
      })
      .catch(() => {
        if (!cancelled) setMessage("Historique paie cloud indisponible, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return employees;
    return employees.filter((employee) =>
      [employee.fullName, employee.role, employee.contractType, employee.cnssNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [employees, query]);

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selectedIds.has(employee.id)),
    [employees, selectedIds],
  );
  const selectedPeriod = normalizePeriod(period);
  const selectedEmployeeIds = useMemo(
    () => new Set(selectedEmployees.map((employee) => employee.id)),
    [selectedEmployees],
  );
  const approvedOvertimeByEmployee = useMemo(() => {
    return timeEntries
      .filter((entry) => entry.status === "approved" && timeEntryPeriod(entry) === selectedPeriod)
      .reduce<Map<string, number>>((amounts, entry) => {
        amounts.set(entry.employeeId, (amounts.get(entry.employeeId) ?? 0) + entry.overtimeAmount);
        return amounts;
      }, new Map());
  }, [selectedPeriod, timeEntries]);
  const approvedOvertimeTotal = selectedEmployees.reduce(
    (sum, employee) => sum + (approvedOvertimeByEmployee.get(employee.id) ?? 0),
    0,
  );
  const payrollReadiness = useMemo(() => {
    const missingCnss = selectedEmployees.filter((employee) => !employee.cnssNumber.trim()).length;
    const invalidSalary = selectedEmployees.filter(
      (employee) => !Number.isFinite(employee.grossSalary) || employee.grossSalary <= 0,
    ).length;
    const inactiveSelected = selectedEmployees.filter((employee) => employee.status !== "Actif").length;
    const pendingLeave = leaveRequests.filter(
      (request) =>
        request.status === "pending" &&
        selectedEmployeeIds.has(request.employeeId) &&
        leaveTouchesPeriod(request, selectedPeriod),
    ).length;
    const pendingTime = timeEntries.filter(
      (entry) =>
        entry.status === "draft" &&
        selectedEmployeeIds.has(entry.employeeId) &&
        timeEntryPeriod(entry) === selectedPeriod,
    ).length;
    const declarationBlockers = missingCnss + invalidSalary;
    const reviewItems = inactiveSelected + pendingLeave + pendingTime;

    return {
      missingCnss,
      invalidSalary,
      inactiveSelected,
      pendingLeave,
      pendingTime,
      declarationBlockers,
      reviewItems,
      status:
        selectedEmployees.length === 0
          ? "Selection requise"
          : declarationBlockers > 0
            ? "Declarations bloquees"
            : reviewItems > 0
              ? "A revoir"
              : "Pret a calculer",
    };
  }, [leaveRequests, selectedEmployeeIds, selectedEmployees, selectedPeriod, timeEntries]);

  const activePayrollRubrics = useMemo(
    () => payrollSettings.rubrics.filter((rubric) => rubric.active && rubric.category !== "deduction"),
    [payrollSettings.rubrics],
  );

  const currentTotals = useMemo(() => {
    const lines = currentRun?.lines ?? [];
    return {
      gross: lines.reduce((sum, line) => sum + line.result.earnings.totalGross, 0),
      net: lines.reduce((sum, line) => sum + line.result.netToPay, 0),
      employerCost: lines.reduce((sum, line) => sum + line.result.employerContributions.totalEmployerCost, 0),
      deductions: lines.reduce((sum, line) => sum + line.result.deductions.totalDeductions, 0),
    };
  }, [currentRun]);
  if (!activeCompany) return null;
  const company = activeCompany;

  const canDownloadPayslips = employerPlanCapabilities[company.plan].canDownloadPayslips;

  function toggleEmployee(employeeId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const employee of filteredEmployees) next.add(employee.id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function updateEmployeeRubricAmount(employeeId: string, rubricId: string, value: string) {
    setEmployeeVariables((current) => ({
      ...current,
      [employeeId]: {
        ...(current[employeeId] ?? { rubricAmounts: {} }),
        rubricAmounts: {
          ...(current[employeeId]?.rubricAmounts ?? {}),
          [rubricId]: value,
        },
      },
    }));
  }

  function buildPayElements(
    employeeId: string,
    overtimeAmount: number,
    manualBonus: number,
    manualAllowance: number,
  ): EmployerPayrollPayElement[] {
    const variables = employeeVariables[employeeId] ?? { rubricAmounts: {} };
    const manualPayElements: EmployerPayrollPayElement[] = [
      {
        label: "Heures supplementaires",
        amount: overtimeAmount,
        category: "overtime",
        taxable: true,
        cnssSubject: true,
        amoSubject: true,
      },
      {
        label: "Prime manuelle",
        amount: manualBonus,
        category: "bonus",
        taxable: true,
        cnssSubject: true,
        amoSubject: true,
      },
      {
        label: "Indemnite manuelle",
        amount: manualAllowance,
        category: "allowance",
        taxable: true,
        cnssSubject: true,
        amoSubject: true,
      },
    ];
    const rubricPayElements = activePayrollRubrics.map((rubric) => ({
      label: rubric.label,
      amount: Number(variables.rubricAmounts[rubric.id]) || 0,
      category: rubric.category as EmployerPayrollPayElement["category"],
      taxable: rubric.taxable,
      cnssSubject: rubric.cnssSubject,
      amoSubject: rubric.amoSubject,
    }));

    return [...manualPayElements, ...rubricPayElements].filter((item) => item.amount > 0);
  }

  async function calculatePayrollRun() {
    setMessage(null);
    if (selectedEmployees.length === 0) {
      setMessage("Selectionnez au moins un salarie pour generer la paie.");
      return;
    }

    setLoading(true);
    try {
      const lines: EmployerPayrollLine[] = [];
      for (const employee of selectedEmployees) {
        const manualBonus = Number(bonus) || 0;
        const manualAllowance = Number(allowances) || 0;
        const overtimeAmount = (Number(overtimePay) || 0) + (approvedOvertimeByEmployee.get(employee.id) ?? 0);
        const payElements = buildPayElements(employee.id, overtimeAmount, manualBonus, manualAllowance);
        const response = await fetch("/api/simulate/payslip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeName: employee.fullName,
            employerId: company.id,
            period,
            grossSalary: employee.grossSalary,
            familyDependentsCount: employee.childrenCount ?? 0,
            overtimePay: 0,
            bonus: 0,
            allowances: 0,
            payElements,
            includeCimr,
            companySize,
            calculationDate: currentDateISO(),
          }),
        });
        const data = (await response.json()) as { ok?: boolean; result?: EmployerPayrollResult; message?: string; error?: string };
        if (!response.ok || !data.ok || !data.result) {
          throw new Error(data.message || data.error || `Calcul impossible pour ${employee.fullName}`);
        }
        lines.push({ employeeId: employee.id, employeeName: employee.fullName, payElements, result: data.result });
      }

      const nextRun: EmployerPayrollRun = {
        id: crypto.randomUUID(),
        period,
        createdAt: new Date().toISOString(),
        lines,
      };
      const nextRuns = [nextRun, ...runs].slice(0, 8);
      setCurrentRun(nextRun);
      setRuns(nextRuns);
      const savedRun = await saveEmployerPayrollRunToCloud(company.id, nextRun);
      if (!savedRun) throw new Error("Sauvegarde cloud de la paie impossible.");
      setCurrentRun(savedRun);
      setRuns((current) => {
        const savedRuns = replacePayrollRunInList(current, savedRun).slice(0, 8);
        writeEmployerPayrollRuns(savedRuns);
        return savedRuns;
      });
      setMessage(
        approvedOvertimeTotal > 0
          ? `Paie ${period} calculee pour ${lines.length} salarie(s), avec ${formatMoney(approvedOvertimeTotal)} de pointage approuve.`
          : `Paie ${period} calculee pour ${lines.length} salarie(s).`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calcul de paie impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPayslipPdf(line: EmployerPayrollLine) {
    if (!canDownloadPayslips) {
      setMessage("Telechargement PDF verrouille sur le plan Free. Passez au plan Pro pour telecharger les bulletins.");
      return;
    }

    const employee = getEmployeeForLine(line, employees);
    try {
      const response = await fetch("/api/employer/payslip-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          company: {
            name: company.name,
            address: company.address ?? "",
            ice: company.ice,
            taxIdentifier: company.taxIdentifier ?? "",
            cnssAffiliateNumber: company.cnssAffiliateNumber,
            city: company.city,
          },
          employee: {
            id: line.employeeId,
            fullName: employee?.fullName ?? line.employeeName,
            employeeNumber: employee?.employeeNumber ?? employee?.id ?? line.employeeId,
            cin: employee?.cin ?? "",
            role: employee?.role ?? "",
            contractType: employee?.contractType ?? "",
            cnssNumber: employee?.cnssNumber ?? "",
            dependents: String(employee?.childrenCount ?? 0),
            hireDate: employee?.startDate ?? "",
          },
          period: line.result.period,
          payElements: line.payElements ?? [],
          annualTotals: getAnnualPayslipTotals(line, runs),
          result: {
            ...line.result,
            earnings: {
              baseSalary: line.result.earnings.baseSalary ?? employee?.grossSalary ?? line.result.earnings.totalGross,
              overtimePay: line.result.earnings.overtimePay ?? 0,
              bonus: line.result.earnings.bonus ?? 0,
              allowances: line.result.earnings.allowances ?? 0,
              totalGross: line.result.earnings.totalGross,
            },
            deductions: {
              cnssEmployeeShortTerm: line.result.deductions.cnssEmployeeShortTerm ?? 0,
              cnssEmployeeLongTerm: line.result.deductions.cnssEmployeeLongTerm ?? 0,
              cnssEmployee: line.result.deductions.cnssEmployee,
              amoEmployee: line.result.deductions.amoEmployee,
              cimrEmployee: line.result.deductions.cimrEmployee ?? 0,
              professionalExpenseDeduction: line.result.deductions.professionalExpenseDeduction ?? 0,
              taxableIncome: line.result.deductions.taxableIncome ?? 0,
              familyTaxReduction: line.result.deductions.familyTaxReduction ?? 0,
              incomeTax: line.result.deductions.incomeTax,
              totalDeductions: line.result.deductions.totalDeductions,
            },
          },
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Generation PDF impossible.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getFilenameFromDisposition(response.headers.get("content-disposition"));
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`PDF genere pour ${line.employeeName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generation PDF impossible.");
    }
  }

  const firstSelected = selectedEmployees[0];
  const firstSelectedOvertime = firstSelected
    ? (Number(overtimePay) || 0) + (approvedOvertimeByEmployee.get(firstSelected.id) ?? 0)
    : 0;
  const detailedSimulatorHref = firstSelected
    ? withAudienceQuery(
        `/planifier/bulletin-paie?employeeName=${encodeURIComponent(firstSelected.fullName)}&period=${encodeURIComponent(period)}&grossSalary=${encodeURIComponent(String(firstSelected.grossSalary))}&overtimePay=${encodeURIComponent(String(firstSelectedOvertime))}&bonus=${encodeURIComponent(bonus || "0")}&allowances=${encodeURIComponent(allowances || "0")}&includeCimr=${includeCimr ? "true" : "false"}&companySize=${companySize}&source=employer-payroll`,
        "employer",
      )
    : withAudienceQuery("/planifier/bulletin-paie?source=employer-payroll", "employer");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Parametres</p>
              <h2 className="mt-2 text-xl font-black">Paie mensuelle</h2>
            </div>
            <Calculator className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Periode</span>
              <input value={period} onChange={(event) => setPeriod(event.target.value)} className="input-shell mt-1" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Taille entreprise</span>
                <select
                  value={companySize}
                  onChange={(event) => setCompanySize(event.target.value as "small" | "large")}
                  className="input-shell mt-1"
                >
                  <option value="small">Petite</option>
                  <option value="large">Grande</option>
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={includeCimr}
                  onChange={(event) => setIncludeCimr(event.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Inclure CIMR
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Heures sup manuelles</span>
                <input
                  type="number"
                  min="0"
                  value={overtimePay}
                  onChange={(event) => setOvertimePay(event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Prime</span>
                <input
                  type="number"
                  min="0"
                  value={bonus}
                  onChange={(event) => setBonus(event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Indemnites</span>
                <input
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={(event) => setAllowances(event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>

            <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
              Pointage approuve pour {period}:{" "}
              <span className="font-bold text-[var(--foreground)]">{formatMoney(approvedOvertimeTotal)}</span>
              {approvedOvertimeTotal > 0 ? " injecte par salarie au calcul." : " aucune heure a injecter."}
            </div>

            <button
              type="button"
              onClick={calculatePayrollRun}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Calculer la paie
            </button>

            <Link
              href={detailedSimulatorHref}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              Ouvrir le simulateur detaille
            </Link>

            {message ? (
              <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
            ) : null}
            <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
              Plan actif: <span className="font-bold text-[var(--foreground)]">{employerPlanLabels[company.plan]}</span>
              {" - "}
              {canDownloadPayslips ? "PDF bulletins debloques" : "PDF bulletins verrouilles"}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Historique paie</p>
          <div className="mt-4 space-y-3">
            {runs.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucune paie calculee pour le contexte actif.</p>
            ) : (
              runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setCurrentRun(run)}
                  className="block w-full rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-left transition hover:border-[var(--accent)]"
                >
                  <p className="text-sm font-black">{run.period}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {run.lines.length} salarie(s) - {new Date(run.createdAt).toLocaleString("fr-MA")}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Revue avant paie</p>
              <h2 className="mt-2 text-xl font-black">Preparation {period}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Le calcul reste disponible. Ces controles signalent ce qui peut fausser la paie ou bloquer la
                preparation des declarations du mois.
              </p>
            </div>
            <div
              className={`inline-flex min-h-12 items-center rounded-lg border px-4 py-3 text-sm font-black ${
                payrollReadiness.declarationBlockers > 0
                  ? "border-[var(--err)] bg-[var(--err-bg)] text-[var(--err)]"
                  : payrollReadiness.reviewItems > 0 || selectedEmployees.length === 0
                    ? "border-[var(--warning-line)] bg-[var(--warning-soft)] text-[#8a520f]"
                    : "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
              }`}
            >
              {payrollReadiness.declarationBlockers > 0 || payrollReadiness.reviewItems > 0 ? (
                <AlertTriangle className="mr-2 h-4 w-4" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {payrollReadiness.status}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/employer/employees"
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]"
            >
              <p className="text-xs font-bold text-[var(--ink-soft)]">Donnees salarie</p>
              <p className="mt-2 text-2xl font-black">{payrollReadiness.invalidSalary + payrollReadiness.inactiveSelected}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {payrollReadiness.invalidSalary} salaire(s) a corriger, {payrollReadiness.inactiveSelected} statut(s) non actif(s).
              </p>
            </Link>
            <Link
              href="/employer/employees"
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]"
            >
              <p className="text-xs font-bold text-[var(--ink-soft)]">CNSS</p>
              <p className="mt-2 text-2xl font-black">{payrollReadiness.missingCnss}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">Numero(s) manquant(s) dans la selection avant declaration.</p>
            </Link>
            <Link
              href="/employer/leave"
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]"
            >
              <p className="text-xs font-bold text-[var(--ink-soft)]">Conges</p>
              <p className="mt-2 text-2xl font-black">{payrollReadiness.pendingLeave}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">Demande(s) du mois encore a valider.</p>
            </Link>
            <Link
              href="/employer/time"
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]"
            >
              <p className="text-xs font-bold text-[var(--ink-soft)]">Pointage</p>
              <p className="mt-2 text-2xl font-black">{payrollReadiness.pendingTime}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">Pointage(s) brouillon a traiter avant cloture.</p>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Selection</p>
              <h2 className="mt-2 text-xl font-black">Salaries a payer</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input-shell h-10 min-w-64 pl-9"
                  style={{ paddingLeft: "2.25rem" }}
                  placeholder="Rechercher"
                />
              </label>
              <button
                type="button"
                onClick={selectAllVisible}
                className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
              >
                Tout selectionner
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
              >
                Vider
              </button>
            </div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {filteredEmployees.map((employee) => {
              const selected = selectedIds.has(employee.id);
              return (
                <label key={employee.id} className="flex cursor-pointer items-center gap-4 p-5 hover:bg-[var(--surface-muted)]">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleEmployee(employee.id)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[var(--heading)]">{employee.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {employee.role} - {employee.contractType} - {formatMoney(employee.grossSalary)}
                    </p>
                    {activePayrollRubrics.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {activePayrollRubrics.map((rubric) => (
                          <div key={rubric.id} className="block">
                            <span className="mb-1 block truncate text-[0.68rem] font-bold text-[var(--ink-soft)]">
                              {rubric.label}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={employeeVariables[employee.id]?.rubricAmounts[rubric.id] ?? "0"}
                              onChange={(event) => updateEmployeeRubricAmount(employee.id, rubric.id, event.target.value)}
                              className="input-shell h-9 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                        Aucun element variable actif. Ajoutez des rubriques dans les parametres paie.
                      </p>
                    )}
                    {(approvedOvertimeByEmployee.get(employee.id) ?? 0) > 0 ? (
                      <p className="mt-1 text-xs font-bold text-[var(--accent)]">
                        Pointage approuve: {formatMoney(approvedOvertimeByEmployee.get(employee.id) ?? 0)}
                      </p>
                    ) : null}
                  </div>
                  {selected ? <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" /> : null}
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Selection</p>
            <p className="mt-2 text-2xl font-black">{selectedEmployees.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Brut</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(currentTotals.gross)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Net a payer</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(currentTotals.net)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Cout employeur</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(currentTotals.employerCost)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <h2 className="text-xl font-black">Resultat de paie</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {currentRun ? `Paie ${currentRun.period}` : "Lancez un calcul pour afficher le recapitulatif."}
            </p>
          </div>
          {currentRun ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  <tr>
                    <th className="px-5 py-3">Salarie</th>
                    <th className="px-5 py-3">Brut</th>
                    <th className="px-5 py-3">Retenues</th>
                    <th className="px-5 py-3">Net</th>
                    <th className="px-5 py-3">Cout employeur</th>
                    <th className="px-5 py-3">Regles</th>
                    <th className="px-5 py-3">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {currentRun.lines.map((line) => (
                    <tr key={line.employeeId}>
                      <td className="px-5 py-4 font-black">{line.employeeName}</td>
                      <td className="px-5 py-4">{formatMoney(line.result.earnings.totalGross)}</td>
                      <td className="px-5 py-4">{formatMoney(line.result.deductions.totalDeductions)}</td>
                      <td className="px-5 py-4 font-black text-[var(--ok)]">{formatMoney(line.result.netToPay)}</td>
                      <td className="px-5 py-4">{formatMoney(line.result.employerContributions.totalEmployerCost)}</td>
                      <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">
                        {line.result.explanation?.versionCode ?? "Regles courantes"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => downloadPayslipPdf(line)}
                          className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition ${
                            canDownloadPayslips
                              ? "bg-[var(--accent)] text-[var(--juris-on-primary)] hover:bg-[var(--accent-dark)]"
                              : "border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {canDownloadPayslips ? <Download className="mr-1.5 h-3.5 w-3.5" /> : <Lock className="mr-1.5 h-3.5 w-3.5" />}
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--ink-soft)]">
              Selectionnez les salaries et cliquez sur Calculer la paie.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
