"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import {
  employerLeaveStatusLabels,
  employerLeaveTypeLabels,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerLeaveStatus,
  type EmployerLeaveType,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies } from "@/lib/employer/company-store";
import { readEmployerEmployees } from "@/lib/employer/employee-store";
import {
  fetchEmployerLeaveRequestsFromCloud,
  readEmployerLeaveRequests,
  saveEmployerLeaveRequestToCloud,
  writeEmployerLeaveRequests,
} from "@/lib/employer/leave-store";

type LeaveFormState = {
  employeeId: string;
  type: EmployerLeaveType;
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
};

const emptyForm: LeaveFormState = {
  employeeId: "",
  type: "paid",
  startDate: "",
  endDate: "",
  days: "",
  reason: "",
};

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(diff, 0);
}

function dateRangesOverlap(leftStart: string, leftEnd: string, rightStart: string, rightEnd: string) {
  const leftStartTime = new Date(leftStart).getTime();
  const leftEndTime = new Date(leftEnd).getTime();
  const rightStartTime = new Date(rightStart).getTime();
  const rightEndTime = new Date(rightEnd).getTime();
  if ([leftStartTime, leftEndTime, rightStartTime, rightEndTime].some(Number.isNaN)) return false;
  return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime;
}

function accruedPaidLeave(startDate: string) {
  const started = new Date(startDate);
  if (Number.isNaN(started.getTime())) return 0;
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth());
  return Math.round(months * 1.5 * 10) / 10;
}

function statusClass(status: EmployerLeaveStatus) {
  if (status === "approved") return "bg-[var(--ok-bg)] text-[var(--ok)]";
  if (status === "rejected") return "bg-[var(--err-bg)] text-[var(--err)]";
  return "bg-[var(--warning-soft)] text-[#8a520f]";
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-MA");
}

function replaceLeaveRequestInList(requests: EmployerLeaveRequest[], request: EmployerLeaveRequest) {
  return requests.some((item) => item.id === request.id)
    ? requests.map((item) => (item.id === request.id ? request : item))
    : [request, ...requests];
}

export function EmployerLeaveClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [requests, setRequests] = useState<EmployerLeaveRequest[]>([]);
  const [form, setForm] = useState<LeaveFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    const nextActiveCompany = getActiveEmployerCompany(nextCompanies);
    const nextEmployees = readEmployerEmployees() ?? [];
    const nextRequests = readEmployerLeaveRequests() ?? [];
    setActiveCompany(nextActiveCompany);
    setEmployees(nextEmployees);
    setRequests(nextRequests);
    setForm((current) => ({ ...current, employeeId: current.employeeId || nextEmployees[0]?.id || "" }));
    if (!nextActiveCompany) return;

    let cancelled = false;
    fetchEmployerLeaveRequestsFromCloud(nextActiveCompany.id)
      .then((cloudRequests) => {
        if (cancelled || !cloudRequests) return;
        setRequests(cloudRequests);
        writeEmployerLeaveRequests(cloudRequests);
      })
      .catch(() => {
        if (!cancelled) setMessage("Conges cloud indisponibles, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== "Sorti"), [employees]);

  const balances = useMemo(() => {
    return activeEmployees.map((employee) => {
      const employeeRequests = requests.filter((request) => request.employeeId === employee.id);
      const approvedPaid = employeeRequests
        .filter((request) => request.status === "approved" && request.type === "paid")
        .reduce((sum, request) => sum + request.days, 0);
      const pendingPaid = employeeRequests
        .filter((request) => request.status === "pending" && request.type === "paid")
        .reduce((sum, request) => sum + request.days, 0);
      const accrued = accruedPaidLeave(employee.startDate);
      return {
        employee,
        accrued,
        approvedPaid,
        pendingPaid,
        remaining: Math.max(0, accrued - approvedPaid),
      };
    });
  }, [activeEmployees, requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!normalizedQuery) return sorted;
    return sorted.filter((request) =>
      [request.employeeName, employerLeaveTypeLabels[request.type], employerLeaveStatusLabels[request.status], request.reason]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, requests]);

  const totals = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === "pending").length,
      approvedDays: requests
        .filter((request) => request.status === "approved")
        .reduce((sum, request) => sum + request.days, 0),
      remaining: balances.reduce((sum, balance) => sum + balance.remaining, 0),
    };
  }, [balances, requests]);

  function updateForm<K extends keyof LeaveFormState>(key: K, value: LeaveFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "startDate" || key === "endDate") && next.startDate && next.endDate) {
        next.days = String(daysBetween(next.startDate, next.endDate));
      }
      return next;
    });
  }

  async function persistLeaveRequest(request: EmployerLeaveRequest, previousRequests: EmployerLeaveRequest[], successMessage: string) {
    if (!activeCompany) return;
    try {
      const savedRequest = await saveEmployerLeaveRequestToCloud(activeCompany.id, request);
      if (!savedRequest) throw new Error("unauthorized");
      setRequests((current) => {
        const nextRequests = replaceLeaveRequestInList(current, savedRequest);
        writeEmployerLeaveRequests(nextRequests);
        return nextRequests;
      });
      setMessage(successMessage);
    } catch {
      setRequests(previousRequests);
      setMessage("Demande non sauvegardee. Verifiez la connexion et reessayez.");
    }
  }

  function submitLeave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const employee = employees.find((item) => item.id === form.employeeId);
    const days = Number(form.days);
    if (!employee) {
      setMessage("Selectionnez un salarie avant d ajouter une demande.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setMessage("Renseignez les dates de debut et de fin.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setMessage("La date de fin doit etre posterieure ou egale a la date de debut.");
      return;
    }
    if (!Number.isFinite(days) || days <= 0) {
      setMessage("Renseignez un nombre de jours valide.");
      return;
    }
    const overlappingRequest = requests.find(
      (request) =>
        request.employeeId === employee.id &&
        request.status !== "rejected" &&
        dateRangesOverlap(form.startDate, form.endDate, request.startDate, request.endDate),
    );
    if (overlappingRequest) {
      setMessage(
        `Cette periode chevauche deja une demande ${employerLeaveStatusLabels[overlappingRequest.status].toLowerCase()} pour ${employee.fullName}.`,
      );
      return;
    }

    const nextRequest: EmployerLeaveRequest = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.fullName,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      status: "pending",
      reason: form.reason.trim() || "A completer",
      createdAt: new Date().toISOString(),
    };

    const previousRequests = requests;
    setRequests((current) => [nextRequest, ...current]);
    setForm({ ...emptyForm, employeeId: employee.id });
    void persistLeaveRequest(nextRequest, previousRequests, `Demande ajoutee pour ${employee.fullName}.`);
  }

  function decideRequest(requestId: string, status: Exclude<EmployerLeaveStatus, "pending">) {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;
    const updatedRequest = { ...request, status, decidedAt: new Date().toISOString() };
    const previousRequests = requests;
    setRequests((current) => replaceLeaveRequestInList(current, updatedRequest));
    void persistLeaveRequest(updatedRequest, previousRequests, status === "approved" ? "Demande approuvee." : "Demande refusee.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Absence</p>
              <h2 className="mt-2 text-xl font-black">Nouvelle demande</h2>
            </div>
            <CalendarClock className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <form onSubmit={submitLeave} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Salarie</span>
              <select
                value={form.employeeId}
                onChange={(event) => updateForm("employeeId", event.target.value)}
                className="input-shell mt-1"
              >
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Type</span>
              <select
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value as EmployerLeaveType)}
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
                  required
                  value={form.startDate}
                  onChange={(event) => updateForm("startDate", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Fin</span>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(event) => updateForm("endDate", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Jours calendaires</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={form.days}
                onChange={(event) => updateForm("days", event.target.value)}
                className="input-shell mt-1"
                placeholder="3"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Motif</span>
              <textarea
                value={form.reason}
                onChange={(event) => updateForm("reason", event.target.value)}
                className="input-shell mt-1 min-h-24 resize-y py-3"
                placeholder="Ex: conge familial, certificat medical..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
            >
              Ajouter a valider
            </button>
            {message ? (
              <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
            ) : null}
          </form>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Demandes a valider</p>
            <p className="mt-2 text-2xl font-black">{totals.pending}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Jours approuves</p>
            <p className="mt-2 text-2xl font-black">{totals.approvedDays}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Solde total estime</p>
            <p className="mt-2 text-2xl font-black">{totals.remaining.toFixed(1)} j</p>
          </div>
        </section>
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Soldes</p>
              <h2 className="mt-2 text-xl font-black">Compteurs conges payes</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Base de calcul: 1,5 jour acquis par mois travaille.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                <tr>
                  <th className="px-5 py-3">Salarie</th>
                  <th className="px-5 py-3">Acquis</th>
                  <th className="px-5 py-3">Pris</th>
                  <th className="px-5 py-3">En attente</th>
                  <th className="px-5 py-3">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {balances.map((balance) => (
                  <tr key={balance.employee.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-[var(--heading)]">{balance.employee.fullName}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{balance.employee.role}</p>
                    </td>
                    <td className="px-5 py-4 font-bold">{balance.accrued.toFixed(1)} j</td>
                    <td className="px-5 py-4">{balance.approvedPaid.toFixed(1)} j</td>
                    <td className="px-5 py-4">{balance.pendingPaid.toFixed(1)} j</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                        {balance.remaining.toFixed(1)} j
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Validation</p>
              <h2 className="mt-2 text-xl font-black">Demandes & absences</h2>
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

          {message ? <p className="border-b border-[var(--line)] px-5 py-3 text-sm font-bold text-[var(--ok)]">{message}</p> : null}

          <div className="divide-y divide-[var(--line)]">
            {filteredRequests.map((request) => (
              <article key={request.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-[var(--heading)]">{request.employeeName}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(request.status)}`}>
                        {employerLeaveStatusLabels[request.status]}
                      </span>
                      <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--ink-soft)]">
                        {employerLeaveTypeLabels[request.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)} · {request.days} j
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{request.reason}</p>
                  </div>
                  {request.status === "pending" ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => decideRequest(request.id, "approved")}
                        className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-3 text-sm font-bold text-[var(--juris-on-primary)]"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => decideRequest(request.id, "rejected")}
                        className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center text-sm font-bold text-[var(--ink-soft)]">
                      <Clock3 className="mr-2 h-4 w-4" />
                      {request.decidedAt ? formatDate(request.decidedAt) : "Decision enregistree"}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--ink-soft)]">Aucune demande ne correspond a cette recherche.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
