"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  ChartNoAxesCombined,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
  type EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies, readEmployerScopedValue } from "@/lib/employer/company-store";

type TrendRow = {
  id: string;
  period: string;
  gross: number;
  net: number;
  employerCost: number;
  source: "real" | "projection";
};

type BenchmarkRow = {
  role: string;
  employees: number;
  averageGross: number;
  benchmark: number;
  gap: number;
};

const sectorBenchmarks = [
  { match: "comptable", label: "Comptabilite", gross: 9500 },
  { match: "technicien", label: "Support / technique", gross: 6500 },
  { match: "responsable", label: "Administration", gross: 10000 },
  { match: "manager", label: "Management", gross: 14000 },
];

function parseList<T>(value: string | null): T[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatMoney(value: number, digits = 0) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function monthLabel(offset: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return new Intl.DateTimeFormat("fr-MA", { month: "short", year: "2-digit" }).format(date);
}

function payrollTotals(run: EmployerPayrollRun) {
  return run.lines.reduce(
    (totals, line) => ({
      gross: totals.gross + line.result.earnings.totalGross,
      net: totals.net + line.result.netToPay,
      employerCost: totals.employerCost + line.result.employerContributions.totalEmployerCost,
    }),
    { gross: 0, net: 0, employerCost: 0 },
  );
}

function buildTrendRows(payrollRuns: EmployerPayrollRun[], employees: EmployerEmployee[]): TrendRow[] {
  const sortedRuns = [...payrollRuns].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-6);
  if (sortedRuns.length > 0) {
    return sortedRuns.map((run) => ({ id: run.id, period: run.period, ...payrollTotals(run), source: "real" }));
  }

  const activeGross = employees
    .filter((employee) => employee.status !== "Sorti")
    .reduce((sum, employee) => sum + employee.grossSalary, 0);
  const projectedEmployerCost = activeGross * 1.18;

  return [-5, -4, -3, -2, -1, 0].map((offset, index) => {
    const variation = 1 + (index - 5) * 0.012;
    return {
      id: `projection-${offset}`,
      period: monthLabel(offset),
      gross: activeGross * variation,
      net: activeGross * 0.78 * variation,
      employerCost: projectedEmployerCost * variation,
      source: "projection",
    };
  });
}

function resolveBenchmark(role: string) {
  const normalizedRole = role.toLowerCase();
  return sectorBenchmarks.find((benchmark) => normalizedRole.includes(benchmark.match)) ?? {
    match: "general",
    label: "General",
    gross: 8000,
  };
}

function buildBenchmarks(employees: EmployerEmployee[]): BenchmarkRow[] {
  const activeEmployees = employees.filter((employee) => employee.status !== "Sorti");
  const grouped = new Map<string, EmployerEmployee[]>();

  for (const employee of activeEmployees) {
    const benchmark = resolveBenchmark(employee.role);
    const current = grouped.get(benchmark.label) ?? [];
    grouped.set(benchmark.label, [...current, employee]);
  }

  return Array.from(grouped.entries()).map(([role, group]) => {
    const benchmark = resolveBenchmark(role);
    const averageGross = group.reduce((sum, employee) => sum + employee.grossSalary, 0) / Math.max(group.length, 1);
    return {
      role,
      employees: group.length,
      averageGross,
      benchmark: benchmark.gross,
      gap: ((averageGross - benchmark.gross) / benchmark.gross) * 100,
    };
  });
}

function contractDistribution(employees: EmployerEmployee[]) {
  const activeEmployees = employees.filter((employee) => employee.status !== "Sorti");
  const counts = activeEmployees.reduce<Record<string, number>>((acc, employee) => {
    acc[employee.contractType] = (acc[employee.contractType] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    share: activeEmployees.length ? (value / activeEmployees.length) * 100 : 0,
  }));
}

export function EmployerAnalyticsClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<EmployerPayrollRun[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<EmployerTimeEntry[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    setActiveCompany(getActiveEmployerCompany(nextCompanies));
    setEmployees(parseList<EmployerEmployee>(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY)) ?? []);
    setPayrollRuns(parseList<EmployerPayrollRun>(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY)) ?? []);
    setLeaveRequests(parseList<EmployerLeaveRequest>(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY)) ?? []);
    setTimeEntries(parseList<EmployerTimeEntry>(readEmployerScopedValue(EMPLOYER_TIME_ENTRY_STORAGE_KEY)) ?? []);
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== "Sorti"), [employees]);
  const trendRows = useMemo(() => buildTrendRows(payrollRuns, activeEmployees), [activeEmployees, payrollRuns]);
  const latestTrend = trendRows[trendRows.length - 1] ?? {
    id: "empty",
    gross: 0,
    net: 0,
    employerCost: 0,
    period: "N/A",
    source: "projection",
  };
  const previousTrend = trendRows[trendRows.length - 2] ?? latestTrend;
  const maxEmployerCost = Math.max(...trendRows.map((row) => row.employerCost), 1);
  const benchmarks = useMemo(() => buildBenchmarks(activeEmployees), [activeEmployees]);
  const distribution = useMemo(() => contractDistribution(activeEmployees), [activeEmployees]);

  const approvedPaidLeaveDays = leaveRequests
    .filter((request) => request.status === "approved" && request.type === "paid")
    .reduce((sum, request) => sum + request.days, 0);
  const pendingLeaveDays = leaveRequests
    .filter((request) => request.status === "pending")
    .reduce((sum, request) => sum + request.days, 0);
  const approvedOvertimeAmount = timeEntries
    .filter((entry) => entry.status === "approved")
    .reduce((sum, entry) => sum + entry.overtimeAmount, 0);
  const monthlyChange =
    previousTrend.employerCost > 0 ? ((latestTrend.employerCost - previousTrend.employerCost) / previousTrend.employerCost) * 100 : 0;
  const annualProjection = latestTrend.employerCost * 12;
  const averageCostPerEmployee = activeEmployees.length ? latestTrend.employerCost / activeEmployees.length : 0;
  const payrollCoverage = activeEmployees.length
    ? Math.round(((payrollRuns[0]?.lines.length ?? 0) / activeEmployees.length) * 100)
    : 0;

  if (!activeCompany) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Contexte</p>
              <h2 className="mt-2 text-xl font-black">{activeCompany.name}</h2>
            </div>
            <ChartNoAxesCombined className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold text-[var(--ink-soft)]">Runs de paie</p>
              <p className="mt-2 text-2xl font-black">{payrollRuns.length}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {payrollRuns.length > 0 ? "Donnees reelles" : "Projection depuis le registre"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--accent-soft)] p-4">
              <p className="text-xs font-bold text-[var(--accent)]">Couverture paie</p>
              <p className="mt-2 text-2xl font-black text-[var(--accent)]">{payrollCoverage}%</p>
            </div>
          </div>
          <Link
            href="/employer/payroll"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-[var(--juris-on-primary)]"
          >
            Generer une paie
          </Link>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Signaux RH</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--line)] p-3">
              <span className="text-sm font-bold">Conges approuves</span>
              <span className="font-black">{approvedPaidLeaveDays} j</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--line)] p-3">
              <span className="text-sm font-bold">Conges en attente</span>
              <span className="font-black">{pendingLeaveDays} j</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--line)] p-3">
              <span className="text-sm font-bold">Heures sup approuvees</span>
              <span className="font-black">{formatMoney(approvedOvertimeAmount)}</span>
            </div>
          </div>
        </section>
      </aside>

      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Cout employeur</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(latestTrend.employerCost)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Variation mois</p>
            <p className="mt-2 text-2xl font-black">{formatPercent(monthlyChange)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Projection annuelle</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(annualProjection)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Cout / salarie</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(averageCostPerEmployee)}</p>
          </div>
        </div>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Evolution masse salariale</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Cout employeur mensuel, reel si une paie existe.</p>
            </div>
            <span className="w-fit rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--ink-soft)]">
              {latestTrend.source === "real" ? "Donnees paie" : "Projection registre"}
            </span>
          </div>
          <div className="mt-6 grid h-72 grid-cols-6 items-end gap-3 border-b border-[var(--line)] pb-3">
            {trendRows.map((row) => {
              const height = Math.max(8, (row.employerCost / maxEmployerCost) * 100);
              return (
                <div key={row.id} className="flex h-full flex-col justify-end gap-2">
                  <div className="flex min-h-0 flex-1 items-end rounded-lg bg-[var(--surface-muted)] p-1">
                    <div
                      className="w-full rounded-md bg-[var(--accent)] transition"
                      style={{ height: `${height}%` }}
                      title={formatMoney(row.employerCost)}
                    />
                  </div>
                  <div className="min-h-10 text-center">
                    <p className="text-xs font-black text-[var(--heading)]">{row.period}</p>
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">{formatMoney(row.employerCost)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="text-xl font-black">Structure effectif</h2>
            <div className="mt-5 space-y-4">
              {distribution.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[var(--ink-soft)]">{item.value} salarie(s)</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-[var(--surface-muted)]">
                    <div className="h-3 rounded-full bg-[var(--accent)]" style={{ width: `${item.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <h2 className="text-xl font-black">Benchmarks internes</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Comparaison indicative par familles de roles.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  <tr>
                    <th className="px-5 py-3">Famille</th>
                    <th className="px-5 py-3">Salaries</th>
                    <th className="px-5 py-3">Moyenne brute</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Ecart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {benchmarks.map((row) => (
                    <tr key={row.role}>
                      <td className="px-5 py-4 font-black">{row.role}</td>
                      <td className="px-5 py-4">{row.employees}</td>
                      <td className="px-5 py-4">{formatMoney(row.averageGross)}</td>
                      <td className="px-5 py-4 text-[var(--ink-soft)]">{formatMoney(row.benchmark)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-black ${
                            row.gap >= 0 ? "bg-[var(--ok-bg)] text-[var(--ok)]" : "bg-[var(--warning-soft)] text-[#8a520f]"
                          }`}
                        >
                          {formatPercent(row.gap)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/employer/leave" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">Absences</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Valider les demandes qui impactent la paie.</p>
          </Link>
          <Link href="/employer/time" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">Heures sup</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Suivre les majorations approuvees.</p>
          </Link>
          <Link href="/planifier/masse-salariale" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <ChartNoAxesCombined className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">Simulateur avance</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Tester une hypothese de masse salariale.</p>
          </Link>
        </section>
      </section>
    </div>
  );
}
