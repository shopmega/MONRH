"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  FileText,
  Lock,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
  employerPlanCapabilities,
  employerPlanLabels,
  employerSaasModules,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
  type EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies, readEmployerScopedValue } from "@/lib/employer/company-store";

function parseList<T>(value: string | null): T[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function latestPayrollRun(runs: EmployerPayrollRun[]) {
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function cycleState(done: boolean, blocked = false) {
  if (done) return "Pret";
  if (blocked) return "Gate";
  return "A faire";
}

function CycleIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--ok)]" />
  ) : (
    <CircleDashed className="h-5 w-5 shrink-0 text-[var(--accent)]" />
  );
}

export function EmployerDashboardClient() {
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<EmployerPayrollRun[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<EmployerTimeEntry[]>([]);

  useEffect(() => {
    const companies = readEmployerCompanies();
    setActiveCompany(getActiveEmployerCompany(companies));
    setEmployees(parseList<EmployerEmployee>(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY)) ?? []);
    setPayrollRuns(parseList<EmployerPayrollRun>(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY)) ?? []);
    setLeaveRequests(parseList<EmployerLeaveRequest>(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY)) ?? []);
    setTimeEntries(parseList<EmployerTimeEntry>(readEmployerScopedValue(EMPLOYER_TIME_ENTRY_STORAGE_KEY)) ?? []);
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === "Actif"), [employees]);
  const latestRun = useMemo(() => latestPayrollRun(payrollRuns), [payrollRuns]);
  const latestTotals = useMemo(() => {
    const lines = latestRun?.lines ?? [];
    return {
      gross: lines.reduce((sum, line) => sum + line.result.earnings.totalGross, 0),
      net: lines.reduce((sum, line) => sum + line.result.netToPay, 0),
      cost: lines.reduce((sum, line) => sum + line.result.employerContributions.totalEmployerCost, 0),
    };
  }, [latestRun]);

  const pendingLeaves = leaveRequests.filter((request) => request.status === "pending").length;
  const pendingTimeEntries = timeEntries.filter((entry) => entry.status === "draft").length;
  const missingCnss = activeEmployees.filter((employee) => !employee.cnssNumber || employee.cnssNumber === "A completer").length;
  const payrollCoverage = activeEmployees.length
    ? Math.round(((latestRun?.lines.length ?? 0) / activeEmployees.length) * 100)
    : 0;
  const documentsTotal = employees.reduce((sum, employee) => sum + (employee.documents?.length ?? 0), 0);
  const documentsReady = employees.reduce(
    (sum, employee) => sum + (employee.documents?.filter((document) => document.attached).length ?? 0),
    0,
  );

  if (!activeCompany) return null;

  const checklist = [
    ["Creer ou selectionner une entreprise", Boolean(activeCompany.id)],
    ["Ajouter les salaries et contrats actifs", activeEmployees.length > 0],
    ["Verifier salaire de base, primes et anciennete", activeEmployees.every((employee) => employee.grossSalary > 0)],
    ["Generer le premier bulletin de paie", payrollRuns.length > 0],
    ["Debloquer les exports PDF/CSV selon le plan", activeCompany.plan !== "free"],
  ] as const;
  const activePlanCapabilities = employerPlanCapabilities[activeCompany.plan];

  const cycle = [
    ["Preparation salaries", `${activeEmployees.length} salarie(s) actif(s)`, activeEmployees.length > 0, false],
    ["Calcul bulletins", latestRun ? `${latestRun.period} calcule` : "Aucune paie calculee", Boolean(latestRun), false],
    [
      "Validation patron",
      pendingLeaves + pendingTimeEntries > 0 ? `${pendingLeaves + pendingTimeEntries} action(s) en attente` : "Aucune file bloquante",
      pendingLeaves + pendingTimeEntries === 0,
      false,
    ],
    ["Distribution", activeCompany.plan === "free" ? "PDF/CSV verrouilles" : "PDF et CSV disponibles", activeCompany.plan !== "free", activeCompany.plan === "free"],
  ] as const;

  const metrics = [
    {
      label: "Paie mensuelle",
      value: latestRun ? formatMoney(latestTotals.cost) : formatMoney(activeEmployees.reduce((sum, employee) => sum + employee.grossSalary, 0) * 1.18),
      detail: latestRun ? `Dernier run: ${latestRun.period}` : "Projection depuis le registre",
      icon: FileText,
    },
    {
      label: "Salaries",
      value: String(activeEmployees.length),
      detail: `${documentsReady}/${documentsTotal || activeEmployees.length * 5} pieces RH cochees`,
      icon: Users,
    },
    {
      label: "Conformite",
      value: missingCnss + pendingLeaves + pendingTimeEntries === 0 ? "OK" : `${missingCnss + pendingLeaves + pendingTimeEntries}`,
      detail: "CNSS, conges et pointage",
      icon: ShieldCheck,
    },
    {
      label: "Plan",
      value: employerPlanLabels[activeCompany.plan],
      detail: `${payrollCoverage}% couverture paie`,
      icon: Lock,
    },
  ];
  const moduleSignals = {
    people: {
      value: `${activeEmployees.length} actif(s)`,
      detail: `${documentsReady}/${documentsTotal || activeEmployees.length * 5} piece(s) suivie(s)`,
      tone: activeEmployees.length > 0 ? "ready" : "review",
    },
    payroll: {
      value: latestRun ? latestRun.period : "A initialiser",
      detail: latestRun ? `${latestRun.lines.length} bulletin(s) dans le dernier run` : "Premier run a calculer",
      tone: latestRun ? "ready" : "review",
    },
    time: {
      value: `${pendingLeaves + pendingTimeEntries} a valider`,
      detail: `${pendingTimeEntries} pointage(s), ${pendingLeaves} absence(s)`,
      tone: pendingLeaves + pendingTimeEntries > 0 ? "review" : "ready",
    },
    "self-service": {
      value: activeEmployees.length > 0 ? "Connecte" : "En attente",
      detail: "Lie au registre et aux bulletins",
      tone: activeEmployees.length > 0 ? "ready" : "review",
    },
    compliance: {
      value: missingCnss + pendingLeaves + pendingTimeEntries === 0 ? "Sous controle" : "A traiter",
      detail: `${missingCnss} CNSS, ${pendingLeaves + pendingTimeEntries} validation(s)`,
      tone: missingCnss + pendingLeaves + pendingTimeEntries === 0 ? "ready" : "review",
    },
    pilotage: {
      value: activeCompany.plan === "cabinet" ? "Cabinet actif" : employerPlanLabels[activeCompany.plan],
      detail: `${payrollRuns.length} run(s) de paie pour l analyse`,
      tone: payrollRuns.length > 0 ? "ready" : "review",
    },
  } as const;

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.85fr]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                <Building2 className="h-4 w-4" />
                Portail employeur
              </div>
              <h1 className="display-font mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Suite RH & paie employeur
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Orchestrez le registre, les variables du mois, la paie, les declarations et le self-service
                depuis un meme contexte entreprise.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 sm:min-w-64">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                Entreprise active
              </p>
              <p className="mt-2 text-lg font-black text-[var(--heading)]">{activeCompany.name}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {activeCompany.city} - {employerPlanLabels[activeCompany.plan]}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/employer/employees"
              className="inline-flex h-11 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un salarie
            </Link>
            <Link
              href="/employer/payroll"
              className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              Generer une paie
            </Link>
            <Link
              href="/employer/cnss"
              className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              Ouvrir declarations
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                Bundle actif
              </p>
              <h2 className="mt-2 text-lg font-black">{employerPlanLabels[activeCompany.plan]}</h2>
            </div>
            <Lock className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Les modules sont visibles ensemble; le plan controle les volumes, exports et livrables.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-bold text-[var(--ink-soft)]">Capacite</p>
              <p className="mt-1 font-black">
                {activePlanCapabilities.maxEmployees} salarie(s) / {activePlanCapabilities.maxCompanies} entreprise(s)
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-bold text-[var(--ink-soft)]">Livrables</p>
              <p className="mt-1 font-black">
                {activePlanCapabilities.canDownloadPayslips ? "PDF" : "PDF verrouilles"} -{" "}
                {activePlanCapabilities.canExportCsv ? "CSV" : "CSV verrouilles"}
              </p>
            </div>
          </div>
          <Link
            href="/employer/settings"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
          >
            Gerer le plan
          </Link>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[var(--ink-soft)]">{metric.label}</span>
                <Icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-3 text-2xl font-black text-[var(--heading)]">{metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{metric.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Modules</p>
          <h2 className="mt-2 text-lg font-black">Suite employeur MONRH</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Chaque module rejoint le meme registre, le meme contexte entreprise et le meme cycle de paie.
          </p>
        </div>
        <div className="grid gap-3 p-5 lg:grid-cols-2">
          {employerSaasModules.map((module) => {
            const Icon = module.icon;
            const signal = moduleSignals[module.id];
            return (
              <article key={module.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                        {module.scope}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[var(--heading)]">{module.title}</h3>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      signal.tone === "ready"
                        ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                        : "bg-[var(--warning-soft)] text-[#8a520f]"
                    }`}
                  >
                    {signal.value}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{module.description}</p>
                <p className="mt-2 text-xs font-bold text-[var(--foreground)]">{signal.detail}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-bold transition hover:border-[var(--accent)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={module.href}
                    aria-label={`Ouvrir ${module.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <h2 className="text-lg font-black">Cycle paie du mois</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Vue connectee pour suivre preparation, validation, PDF et exports.
            </p>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {cycle.map(([title, detail, done, blocked]) => (
              <div key={title} className="flex items-center gap-4 p-5">
                <CycleIcon done={Boolean(done)} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[var(--heading)]">{title}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{detail}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    done
                      ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                      : blocked
                        ? "bg-[var(--warning-soft)] text-[#8a520f]"
                        : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"
                  }`}
                >
                  {cycleState(Boolean(done), Boolean(blocked))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                Mise en route
              </p>
              <h2 className="mt-2 text-lg font-black">Checklist entreprise</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="mt-5 space-y-3">
            {checklist.map(([item, done], index) => (
              <div key={item} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                    done
                      ? "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
                      : "border-[var(--line)] text-[var(--ink-soft)]"
                  }`}
                >
                  {done ? "OK" : index + 1}
                </span>
                <p className="text-sm leading-6 text-[var(--ink-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
