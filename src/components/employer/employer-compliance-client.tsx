"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, CalendarClock, CheckCircle2, FileText, Info, Search, ShieldAlert } from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  employerDocumentChecklist,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
} from "@/lib/employer/portal-data";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";
import { getActiveEmployerCompany, readEmployerCompanies, readEmployerScopedValue } from "@/lib/employer/company-store";
import {
  clearEmployerComplianceDismissalsInCloud,
  fetchEmployerComplianceDismissalsFromCloud,
  readEmployerComplianceDismissals,
  saveEmployerComplianceDismissalToCloud,
  writeEmployerComplianceDismissals,
} from "@/lib/employer/compliance-dismissal-store";

type ComplianceSeverity = "high" | "medium" | "low";

type ComplianceAlert = {
  id: string;
  title: string;
  detail: string;
  category: string;
  severity: ComplianceSeverity;
  href: string;
  dueLabel: string;
};

function parseList<T>(value: string | null): T[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function daysUntil(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function latestPayrollRun(runs: EmployerPayrollRun[]) {
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function severityClass(severity: ComplianceSeverity) {
  if (severity === "high") return "bg-[var(--err-bg)] text-[var(--err)]";
  if (severity === "medium") return "bg-[var(--warning-soft)] text-[#8a520f]";
  return "bg-[var(--accent-soft)] text-[var(--accent)]";
}

function buildAlerts(
  employees: EmployerEmployee[],
  payrollRuns: EmployerPayrollRun[],
  leaveRequests: EmployerLeaveRequest[],
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];
  const activeEmployees = employees.filter((employee) => employee.status !== "Sorti");

  const today = new Date().toISOString().slice(0, 10);
  const smigRules = getSmigRulesByDate(today);
  const smigMonthlyRef = Math.round(smigRules.smigHourlyMad * smigRules.referenceHoursPerMonth * 100) / 100;

  // Global SMIG Reform Alert for 2026
  if (today.startsWith("2026")) {
    alerts.push({
      id: "smig-reform-2026",
      title: "Reevaluation du SMIG 2026",
      detail: `Le SMIG horaire est passe a ${smigRules.smigHourlyMad} MAD. Verifiez que vos bas salaires respectent le nouveau minimum mensuel de ${smigMonthlyRef} MAD.`,
      category: "Reforme",
      severity: "medium",
      href: "/employer/payroll-settings",
      dueLabel: "Janvier 2026",
    });
  }

  activeEmployees.forEach((employee) => {
    if (employee.contractType === "CDD") {
      if (!employee.endDate) {
        alerts.push({
          id: `cdd-missing-end-${employee.id}`,
          title: `Date fin CDD manquante - ${employee.fullName}`,
          detail: "Le CDD doit porter une date de fin et un motif legal identifiable.",
          category: "Contrat",
          severity: "high",
          href: "/employer/employees",
          dueLabel: "A completer",
        });
      } else {
        const remaining = daysUntil(employee.endDate);
        if (remaining !== null && remaining <= 45) {
          alerts.push({
            id: `cdd-expiring-${employee.id}-${employee.endDate}`,
            title: `CDD a surveiller - ${employee.fullName}`,
            detail: remaining < 0 ? "Le contrat est deja arrive a echeance." : `Echeance dans ${remaining} jour(s).`,
            category: "Contrat",
            severity: remaining <= 15 ? "high" : "medium",
            href: "/employer/employees",
            dueLabel: employee.endDate,
          });
        }
      }
    }

    const documents = employerDocumentChecklist.map((document) => {
      const stored = employee.documents?.find((item) => item.type === document.type);
      return { ...document, attached: stored?.attached ?? false };
    });
    const missingDocuments = documents.filter((document) => !document.attached);
    if (missingDocuments.length > 0) {
      alerts.push({
        id: `missing-docs-${employee.id}-${missingDocuments.map((document) => document.type).join("-")}`,
        title: `Dossier RH incomplet - ${employee.fullName}`,
        detail: `Pieces manquantes: ${missingDocuments.map((document) => document.label).join(", ")}.`,
        category: "Documents",
        severity: missingDocuments.some((document) => document.type === "contract" || document.type === "cnss") ? "high" : "medium",
        href: "/employer/employees",
        dueLabel: `${documents.length - missingDocuments.length}/${documents.length}`,
      });
    }

    if (employee.grossSalary > 0 && employee.grossSalary < smigMonthlyRef) {
      alerts.push({
        id: `smig-${employee.id}-${employee.grossSalary}`,
        title: `Salaire a verifier - ${employee.fullName}`,
        detail: `Salaire brut ${employee.grossSalary} MAD sous la reference SMIG mensuelle ${smigMonthlyRef} MAD (Ref: ${smigRules.smigHourlyMad} MAD/h).`,
        category: "Paie",
        severity: "high",
        href: "/employer/employees",
        dueLabel: "SMIG",
      });
    }
  });

  const latestRun = latestPayrollRun(payrollRuns);
  if (!latestRun) {
    alerts.push({
      id: "payroll-not-run",
      title: "Aucune paie mensuelle calculee",
      detail: "Calculez une paie pour alimenter les bulletins PDF et l'export CNSS.",
      category: "Paie",
      severity: "medium",
      href: "/employer/payroll",
      dueLabel: "Mois courant",
    });
  } else {
    alerts.push({
      id: `cnss-export-${latestRun.id}`,
      title: `Verifier export CNSS - ${latestRun.period}`,
      detail: "Controlez le recap CNSS avant depot mensuel et paiement.",
      category: "CNSS",
      severity: "low",
      href: "/employer/cnss",
      dueLabel: latestRun.period,
    });

    latestRun.lines.forEach((line) => {
      line.result.explanation?.warnings?.forEach((warning, index) => {
        alerts.push({
          id: `payroll-warning-${latestRun.id}-${line.employeeId}-${index}`,
          title: `Alerte paie - ${line.employeeName}`,
          detail: warning,
          category: "Paie",
          severity: "medium",
          href: "/employer/payroll",
          dueLabel: latestRun.period,
        });
      });
    });
  }

  const pendingLeaves = leaveRequests.filter((request) => request.status === "pending");
  if (pendingLeaves.length > 0) {
    alerts.push({
      id: `pending-leaves-${pendingLeaves.map((request) => request.id).join("-")}`,
      title: `${pendingLeaves.length} demande(s) de conge a valider`,
      detail: "Les absences en attente doivent etre approuvees ou refusees avant consolidation paie.",
      category: "Absences",
      severity: "medium",
      href: "/employer/leave",
      dueLabel: "A valider",
    });
  }

  return alerts.sort((a, b) => {
    const rank: Record<ComplianceSeverity, number> = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category);
  });
}

export function EmployerComplianceClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<EmployerPayrollRun[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const companies = readEmployerCompanies();
    const company = getActiveEmployerCompany(companies);
    setEmployees(parseList<EmployerEmployee>(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY)) ?? []);
    setPayrollRuns(parseList<EmployerPayrollRun>(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY)) ?? []);
    setLeaveRequests(parseList<EmployerLeaveRequest>(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY)) ?? []);
    setActiveCompany(company);
    const cachedDismissals = readEmployerComplianceDismissals();
    setDismissed(new Set(cachedDismissals.map((item) => item.alertId)));
    if (!company) return;

    let cancelled = false;
    fetchEmployerComplianceDismissalsFromCloud(company.id)
      .then((cloudDismissals) => {
        if (cancelled || !cloudDismissals) return;
        writeEmployerComplianceDismissals(cloudDismissals);
        setDismissed(new Set(cloudDismissals.map((item) => item.alertId)));
      })
      .catch(() => {
        if (!cancelled) setMessage("Alertes traitees cloud indisponibles, cache local conserve.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const alerts = useMemo(
    () => buildAlerts(employees, payrollRuns, leaveRequests).filter((alert) => !dismissed.has(alert.id)),
    [dismissed, employees, leaveRequests, payrollRuns],
  );

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return alerts;
    return alerts.filter((alert) =>
      [alert.title, alert.detail, alert.category, alert.dueLabel].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [alerts, query]);

  const totals = useMemo(
    () => ({
      high: alerts.filter((alert) => alert.severity === "high").length,
      medium: alerts.filter((alert) => alert.severity === "medium").length,
      low: alerts.filter((alert) => alert.severity === "low").length,
    }),
    [alerts],
  );

  async function dismissAlert(alertId: string) {
    if (!activeCompany) {
      setMessage("Aucune entreprise active pour enregistrer le traitement.");
      return;
    }
    const reason = window.prompt("Motif de traitement de l'alerte", "Controle traite dans le module concerne.");
    if (!reason?.trim()) return;
    const nextDismissal = {
      alertId,
      reason: reason.trim(),
      dismissedAt: new Date().toISOString(),
    };

    try {
      const savedDismissal = await saveEmployerComplianceDismissalToCloud(activeCompany.id, nextDismissal);
      if (!savedDismissal) throw new Error("Session requise pour enregistrer le traitement.");
      const nextDismissals = [
        savedDismissal,
        ...readEmployerComplianceDismissals().filter((item) => item.alertId !== savedDismissal.alertId),
      ];
      writeEmployerComplianceDismissals(nextDismissals);
      setDismissed(new Set(nextDismissals.map((item) => item.alertId)));
      setMessage("Alerte marquee traitee avec motif.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Traitement de l'alerte non sauvegarde.");
    }
  }

  async function resetDismissed() {
    if (activeCompany) {
      try {
        await clearEmployerComplianceDismissalsInCloud(activeCompany.id);
      } catch {
        setMessage("Reinitialisation cloud indisponible, cache local reinitialise.");
      }
    }
    writeEmployerComplianceDismissals([]);
    setDismissed(new Set());
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Conformite</p>
              <h2 className="mt-2 text-xl font-black">Synthese alertes</h2>
            </div>
            <ShieldAlert className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-[var(--err-bg)] p-4">
              <p className="text-xs font-bold text-[var(--err)]">Critiques</p>
              <p className="mt-2 text-2xl font-black text-[var(--err)]">{totals.high}</p>
            </div>
            <div className="rounded-lg bg-[var(--warning-soft)] p-4">
              <p className="text-xs font-bold text-[#8a520f]">A traiter</p>
              <p className="mt-2 text-2xl font-black text-[#8a520f]">{totals.medium}</p>
            </div>
            <div className="rounded-lg bg-[var(--accent-soft)] p-4">
              <p className="text-xs font-bold text-[var(--accent)]">Rappels</p>
              <p className="mt-2 text-2xl font-black text-[var(--accent)]">{totals.low}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetDismissed}
            className="mt-4 h-10 w-full rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
          >
            Reafficher les alertes traitees
          </button>
          {message ? (
            <p className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
          ) : null}
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-black">Regles suivies</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
            <p>CDD avec date de fin proche ou manquante.</p>
            <p>Dossier RH incomplet: contrat, CIN, CNSS, RIB, certificat medical.</p>
            <div className="flex items-start gap-2 rounded-lg bg-[var(--surface-muted)] p-2 text-xs">
              <Info className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <p>
                Ref SMIG: {getSmigRulesByDate(new Date().toISOString().slice(0, 10)).smigHourlyMad} MAD/h
                soit env. {Math.round(getSmigRulesByDate(new Date().toISOString().slice(0, 10)).smigHourlyMad * 191)} MAD/mois.
              </p>
            </div>
            <p>CNSS a verifier apres chaque paie calculee.</p>
          </div>
        </section>
      </aside>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">File de controle</p>
            <h2 className="mt-2 text-xl font-black">Alertes actives</h2>
          </div>
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
        </div>

        <div className="divide-y divide-[var(--line)]">
          {filteredAlerts.map((alert) => (
            <article key={alert.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${severityClass(alert.severity)}`}>
                      {alert.severity === "high" ? "Critique" : alert.severity === "medium" ? "A traiter" : "Rappel"}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--ink-soft)]">
                      {alert.category}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--ink-soft)]">
                      <CalendarClock className="mr-1 h-3.5 w-3.5" />
                      {alert.dueLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-[var(--heading)]">{alert.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{alert.detail}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={alert.href}
                    className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-3 text-sm font-bold text-[var(--juris-on-primary)]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ouvrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Traite
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-[var(--ink-soft)]" />
            <p className="mt-3 font-bold text-[var(--heading)]">Aucune alerte active</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Les controles actuels ne signalent rien pour le registre actif.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
