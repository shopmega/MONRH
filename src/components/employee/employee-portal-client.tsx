"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Download, FileText, FolderCheck, Lock, UserRoundCheck } from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  employerDocumentChecklist,
  employerLeaveStatusLabels,
  employerLeaveTypeLabels,
  employerPlanCapabilities,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerLeaveType,
  type EmployerPayrollLine,
  type EmployerPayrollRun,
} from "@/lib/employer/portal-data";
import {
  getActiveEmployerCompany,
  readEmployerCompanies,
  readEmployerScopedValue,
} from "@/lib/employer/company-store";
import { saveEmployerLeaveRequestToCloud, writeEmployerLeaveRequests } from "@/lib/employer/leave-store";

type LeaveFormState = {
  type: EmployerLeaveType;
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
};

const emptyLeaveForm: LeaveFormState = {
  type: "paid",
  startDate: "",
  endDate: "",
  days: "",
  reason: "",
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

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

function accruedPaidLeave(startDate: string) {
  const started = new Date(startDate);
  if (Number.isNaN(started.getTime())) return 0;
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth());
  return Math.round(months * 1.5 * 10) / 10;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-MA");
}

function getFilenameFromDisposition(value: string | null) {
  const match = value?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? "bulletin-paie.pdf";
}

function statusClass(status: EmployerLeaveRequest["status"]) {
  if (status === "approved") return "bg-[var(--ok-bg)] text-[var(--ok)]";
  if (status === "rejected") return "bg-[var(--err-bg)] text-[var(--err)]";
  return "bg-[var(--warning-soft)] text-[#8a520f]";
}

function employeePayrollLines(employeeId: string, runs: EmployerPayrollRun[]) {
  const latestByPeriod = new Map<
    string,
    {
      runId: string;
      period: string;
      createdAt: string;
      line: EmployerPayrollLine;
    }
  >();

  for (const run of [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (latestByPeriod.has(run.period)) continue;
    const line = run.lines.find((item) => item.employeeId === employeeId);
    if (line) {
      latestByPeriod.set(run.period, {
        runId: run.id,
        period: run.period,
        createdAt: run.createdAt,
        line,
      });
    }
  }

  return Array.from(latestByPeriod.values());
}

function payrollLineYear(line: EmployerPayrollLine) {
  const parsed = line.result.calculationDate ? new Date(line.result.calculationDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
}

function getAnnualPayslipTotals(target: EmployerPayrollLine, lines: ReturnType<typeof employeePayrollLines>) {
  const year = payrollLineYear(target);
  return lines
    .filter((item) => payrollLineYear(item.line) === year)
    .reduce(
      (totals, item) => ({
        incomeTax: totals.incomeTax + item.line.result.deductions.incomeTax,
        cnssEmployee: totals.cnssEmployee + item.line.result.deductions.cnssEmployee,
      }),
      { incomeTax: 0, cnssEmployee: 0 },
    );
}

function replaceLeaveRequestInList(requests: EmployerLeaveRequest[], request: EmployerLeaveRequest) {
  return requests.some((item) => item.id === request.id)
    ? requests.map((item) => (item.id === request.id ? request : item))
    : [request, ...requests];
}

export function EmployeePortalClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<EmployerPayrollRun[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [leaveForm, setLeaveForm] = useState<LeaveFormState>(emptyLeaveForm);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextEmployees = parseList<EmployerEmployee>(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY)) ?? [];
    const nextRequests = parseList<EmployerLeaveRequest>(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY)) ?? [];
    const nextRuns = parseList<EmployerPayrollRun>(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY)) ?? [];
    const nextCompanies = readEmployerCompanies();

    setEmployees(nextEmployees);
    setLeaveRequests(nextRequests);
    setPayrollRuns(nextRuns);
    setActiveCompany(getActiveEmployerCompany(nextCompanies));
  }, []);

  const activeEmployee = employees[0];

  const employeeLeaves = useMemo(
    () =>
      activeEmployee
        ? leaveRequests
            .filter((request) => request.employeeId === activeEmployee.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [activeEmployee, leaveRequests],
  );

  const payrollLines = useMemo(
    () => (activeEmployee ? employeePayrollLines(activeEmployee.id, payrollRuns) : []),
    [activeEmployee, payrollRuns],
  );

  const leaveBalance = useMemo(() => {
    if (!activeEmployee) return { accrued: 0, approved: 0, pending: 0, remaining: 0 };
    const accrued = accruedPaidLeave(activeEmployee.startDate);
    const approved = employeeLeaves
      .filter((request) => request.status === "approved" && request.type === "paid")
      .reduce((sum, request) => sum + request.days, 0);
    const pending = employeeLeaves
      .filter((request) => request.status === "pending" && request.type === "paid")
      .reduce((sum, request) => sum + request.days, 0);
    return { accrued, approved, pending, remaining: Math.max(0, accrued - approved) };
  }, [activeEmployee, employeeLeaves]);

  const documents = useMemo(() => {
    if (!activeEmployee) return [];
    return employerDocumentChecklist.map((document) => {
      const stored = activeEmployee.documents?.find((item) => item.type === document.type);
      return { ...document, attached: stored?.attached ?? false, updatedAt: stored?.updatedAt };
    });
  }, [activeEmployee]);

  const canDownloadPayslips = activeCompany ? employerPlanCapabilities[activeCompany.plan].canDownloadPayslips : false;
  const latestPayslip = payrollLines[0];

  function updateLeaveForm<K extends keyof LeaveFormState>(key: K, value: LeaveFormState[K]) {
    setLeaveForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "startDate" || key === "endDate") && next.startDate && next.endDate) {
        next.days = String(daysBetween(next.startDate, next.endDate));
      }
      return next;
    });
  }

  function submitLeaveRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeEmployee || !activeCompany) return;
    const days = Number(leaveForm.days);
    if (!leaveForm.startDate || !leaveForm.endDate || !Number.isFinite(days) || days <= 0) {
      setMessage("Completez les dates et le nombre de jours.");
      return;
    }

    const nextRequest: EmployerLeaveRequest = {
      id: crypto.randomUUID(),
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.fullName,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days,
      status: "pending",
      reason: leaveForm.reason.trim() || "Demande employee",
      createdAt: new Date().toISOString(),
    };

    const previousRequests = leaveRequests;
    setLeaveRequests((current) => [nextRequest, ...current]);
    saveEmployerLeaveRequestToCloud(activeCompany.id, nextRequest)
      .then((savedRequest) => {
        if (!savedRequest) throw new Error("unauthorized");
        setLeaveRequests((current) => {
          const nextRequests = replaceLeaveRequestInList(current, savedRequest);
          writeEmployerLeaveRequests(nextRequests);
          return nextRequests;
        });
        setMessage("Demande envoyee au portail employeur.");
      })
      .catch(() => {
        setLeaveRequests(previousRequests);
        setMessage("Demande non sauvegardee. Verifiez la connexion et reessayez.");
      });
    setLeaveForm(emptyLeaveForm);
  }

  async function downloadPayslipPdf(line: EmployerPayrollLine) {
    if (!activeEmployee || !activeCompany) return;
    if (!canDownloadPayslips) {
      setMessage("PDF verrouille sur le plan Free de l entreprise.");
      return;
    }

    try {
      const response = await fetch("/api/employer/payslip-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompany.id,
          company: {
            name: activeCompany.name,
            ice: activeCompany.ice,
            cnssAffiliateNumber: activeCompany.cnssAffiliateNumber,
            city: activeCompany.city,
          },
          employee: {
            fullName: activeEmployee.fullName,
            employeeNumber: activeEmployee.employeeNumber ?? activeEmployee.id,
            cin: activeEmployee.cin ?? "",
            role: activeEmployee.role,
            contractType: activeEmployee.contractType,
            cnssNumber: activeEmployee.cnssNumber,
            dependents: String(activeEmployee.childrenCount ?? 0),
          },
          period: line.result.period,
          annualTotals: getAnnualPayslipTotals(line, payrollLines),
          result: line.result,
        }),
      });

      if (!response.ok) throw new Error("Generation PDF impossible.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getFilenameFromDisposition(response.headers.get("content-disposition"));
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Bulletin PDF genere.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generation PDF impossible.");
    }
  }

  if (!activeEmployee || !activeCompany) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        <UserRoundCheck className="mx-auto h-8 w-8 text-[var(--accent)]" />
        <p className="mt-3 text-lg font-black">Aucun salarie disponible</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Ajoutez un salarie dans le portail employeur.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Profil</p>
              <h2 className="mt-2 text-xl font-black">Espace salarie</h2>
            </div>
            <UserRoundCheck className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="mt-5 rounded-lg bg-[var(--surface-muted)] p-4">
            <p className="text-lg font-black">{activeEmployee.fullName}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{activeEmployee.role}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[var(--ink-soft)]">Contrat</span>
                <span className="font-bold">{activeEmployee.contractType}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--ink-soft)]">Date entree</span>
                <span className="font-bold">{formatDate(activeEmployee.startDate)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--ink-soft)]">CNSS</span>
                <span className="font-bold">{activeEmployee.cnssNumber}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Conge paye</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[var(--accent-soft)] p-4">
              <p className="text-xs font-bold text-[var(--accent)]">Solde estime</p>
              <p className="mt-2 text-2xl font-black text-[var(--accent)]">{leaveBalance.remaining}</p>
            </div>
            <div className="rounded-lg bg-[var(--warning-soft)] p-4">
              <p className="text-xs font-bold text-[#8a520f]">En attente</p>
              <p className="mt-2 text-2xl font-black text-[#8a520f]">{leaveBalance.pending}</p>
            </div>
          </div>
        </section>
      </aside>

      <section className="grid gap-6">
        {message ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Dernier net</p>
            <p className="mt-2 text-2xl font-black">
              {latestPayslip ? formatMoney(latestPayslip.line.result.netToPay) : "N/A"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Demandes conge</p>
            <p className="mt-2 text-2xl font-black">{employeeLeaves.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <FolderCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Documents prets</p>
            <p className="mt-2 text-2xl font-black">
              {documents.filter((document) => document.attached).length}/{documents.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Absence</p>
                <h2 className="mt-2 text-xl font-black">Nouvelle demande</h2>
              </div>
              <CalendarClock className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <form onSubmit={submitLeaveRequest} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Type</span>
                <select
                  value={leaveForm.type}
                  onChange={(event) => updateLeaveForm("type", event.target.value as EmployerLeaveType)}
                  className="input-shell mt-1"
                >
                  {Object.entries(employerLeaveTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-[var(--ink-soft)]">Debut</span>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(event) => updateLeaveForm("startDate", event.target.value)}
                    className="input-shell mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[var(--ink-soft)]">Fin</span>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(event) => updateLeaveForm("endDate", event.target.value)}
                    className="input-shell mt-1"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Jours</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={leaveForm.days}
                  onChange={(event) => updateLeaveForm("days", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Motif</span>
                <textarea
                  value={leaveForm.reason}
                  onChange={(event) => updateLeaveForm("reason", event.target.value)}
                  className="input-shell mt-1 min-h-24 resize-none"
                  placeholder="Precision utile pour le manager"
                />
              </label>
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-[var(--juris-on-primary)]"
              >
                Envoyer la demande
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <h2 className="text-xl font-black">Mes bulletins</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Historique issu des runs de paie employeur.</p>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {payrollLines.length > 0 ? (
                payrollLines.map((item) => (
                  <div key={`${item.runId}-${item.line.employeeId}`} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{item.period}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        Brut {formatMoney(item.line.result.earnings.totalGross)} - Net {formatMoney(item.line.result.netToPay)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadPayslipPdf(item.line)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
                    >
                      {canDownloadPayslips ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      PDF
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-[var(--accent)]" />
                  <p className="mt-3 text-lg font-black">Aucun bulletin disponible</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">Generez une paie cote employeur pour alimenter cet espace.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <h2 className="text-xl font-black">Mes demandes</h2>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {employeeLeaves.length > 0 ? (
                employeeLeaves.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center gap-4 p-5">
                    <CalendarClock className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{employerLeaveTypeLabels[request.type]}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)} | {request.days} jour(s)
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(request.status)}`}>
                      {employerLeaveStatusLabels[request.status]}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-[var(--ink-soft)]">Aucune demande enregistree.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <h2 className="text-xl font-black">Documents RH</h2>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {documents.map((document) => (
                <div key={document.type} className="flex items-center gap-4 p-5">
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${document.attached ? "text-[var(--ok)]" : "text-[var(--ink-soft)] opacity-40"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{document.label}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {document.attached ? "Disponible dans le dossier RH" : "En attente cote employeur"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
