"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  ClipboardList,
  FileText,
  MessageSquareText,
  Send,
  ShieldAlert,
  Timer,
} from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
  employerDocumentChecklist,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
  type EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import { readEmployerScopedValue } from "@/lib/employer/company-store";

type AssistantRisk = "high" | "medium" | "low";

type AssistantAnswer = {
  id: string;
  question: string;
  title: string;
  summary: string;
  risk: AssistantRisk;
  bullets: string[];
  actionHref: string;
  actionLabel: string;
};

const promptChips = [
  "Quels dossiers salaries sont incomplets ?",
  "Que faire avant la declaration CNSS ?",
  "Quelles demandes de conge bloquent la paie ?",
  "Les heures supplementaires sont-elles validees ?",
  "Quels CDD demandent une action ?",
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

function daysUntil(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function riskClass(risk: AssistantRisk) {
  if (risk === "high") return "bg-[var(--err-bg)] text-[var(--err)]";
  if (risk === "medium") return "bg-[var(--warning-soft)] text-[#8a520f]";
  return "bg-[var(--accent-soft)] text-[var(--accent)]";
}

function riskLabel(risk: AssistantRisk) {
  if (risk === "high") return "Risque fort";
  if (risk === "medium") return "A verifier";
  return "Sous controle";
}

function missingDocuments(employee: EmployerEmployee) {
  return employerDocumentChecklist.filter((document) => {
    const stored = employee.documents?.find((item) => item.type === document.type);
    return !(stored?.attached ?? false);
  });
}

function latestPayrollRun(runs: EmployerPayrollRun[]) {
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function buildAnswer(
  question: string,
  employees: EmployerEmployee[],
  leaveRequests: EmployerLeaveRequest[],
  timeEntries: EmployerTimeEntry[],
  payrollRuns: EmployerPayrollRun[],
): AssistantAnswer {
  const normalized = question.toLowerCase();
  const activeEmployees = employees.filter((employee) => employee.status !== "Sorti");
  const cddIssues = activeEmployees.filter((employee) => {
    if (employee.contractType !== "CDD") return false;
    if (!employee.endDate) return true;
    const remaining = daysUntil(employee.endDate);
    return remaining !== null && remaining <= 45;
  });
  const employeesWithMissingDocs = activeEmployees.filter((employee) => missingDocuments(employee).length > 0);
  const pendingLeaves = leaveRequests.filter((request) => request.status === "pending");
  const pendingTimeEntries = timeEntries.filter((entry) => entry.status === "draft");
  const latestRun = latestPayrollRun(payrollRuns);

  if (normalized.includes("conge") || normalized.includes("absence")) {
    return {
      id: `leave-${Date.now()}`,
      question,
      title: `${pendingLeaves.length} demande(s) d absence en attente`,
      summary:
        pendingLeaves.length > 0
          ? "Validez ou refusez les absences avant de figer la paie du mois."
          : "Aucune demande d absence en attente dans le portail.",
      risk: pendingLeaves.length > 0 ? "medium" : "low",
      bullets:
        pendingLeaves.length > 0
          ? pendingLeaves.slice(0, 4).map((request) => `${request.employeeName}: ${request.days} jour(s) des le ${request.startDate}`)
          : ["Le registre des conges peut rester en observation.", "Controlez les justificatifs avant le prochain cycle paie."],
      actionHref: "/employer/leave",
      actionLabel: "Ouvrir les conges",
    };
  }

  if (normalized.includes("heure") || normalized.includes("pointage") || normalized.includes("supplementaire")) {
    const approvedAmount = timeEntries
      .filter((entry) => entry.status === "approved")
      .reduce((sum, entry) => sum + entry.overtimeAmount, 0);
    return {
      id: `time-${Date.now()}`,
      question,
      title: `${pendingTimeEntries.length} pointage(s) a valider`,
      summary:
        pendingTimeEntries.length > 0
          ? "Les heures supplementaires doivent etre approuvees avant integration dans la paie."
          : "Aucun pointage en attente de validation.",
      risk: pendingTimeEntries.length > 0 ? "medium" : "low",
      bullets: [
        `${approvedAmount.toLocaleString("fr-MA")} MAD d heures supplementaires deja approuvees.`,
        ...pendingTimeEntries.slice(0, 3).map((entry) => `${entry.employeeName}: semaine du ${entry.weekStart}`),
      ],
      actionHref: "/employer/time",
      actionLabel: "Verifier le pointage",
    };
  }

  if (normalized.includes("cnss") || normalized.includes("declaration") || normalized.includes("paie")) {
    return {
      id: `payroll-${Date.now()}`,
      question,
      title: latestRun ? `Derniere paie: ${latestRun.period}` : "Aucune paie calculee",
      summary: latestRun
        ? "Controlez les lignes de paie puis exportez le recap CNSS du meme mois."
        : "L export CNSS a besoin d une paie mensuelle calculee pour alimenter les montants.",
      risk: latestRun ? "low" : "medium",
      bullets: latestRun
        ? [
            `${latestRun.lines.length} salarie(s) dans le dernier run.`,
            `Cout employeur total: ${latestRun.lines
              .reduce((sum, line) => sum + line.result.employerContributions.totalEmployerCost, 0)
              .toLocaleString("fr-MA")} MAD.`,
          ]
        : ["Lancez un calcul de paie.", "Controlez ensuite le bordereau CNSS avant depot."],
      actionHref: latestRun ? "/employer/cnss" : "/employer/payroll",
      actionLabel: latestRun ? "Ouvrir CNSS" : "Calculer la paie",
    };
  }

  if (normalized.includes("cdd") || normalized.includes("contrat")) {
    return {
      id: `contract-${Date.now()}`,
      question,
      title: `${cddIssues.length} CDD a traiter`,
      summary:
        cddIssues.length > 0
          ? "Les CDD sans date de fin ou proches de l echeance demandent une decision RH."
          : "Aucun CDD proche de l echeance dans le registre actif.",
      risk: cddIssues.length > 0 ? "high" : "low",
      bullets:
        cddIssues.length > 0
          ? cddIssues.map((employee) =>
              employee.endDate ? `${employee.fullName}: echeance ${employee.endDate}` : `${employee.fullName}: date de fin manquante`,
            )
          : ["Gardez le motif et l echeance dans la fiche salarie.", "Preparez l avenant ou la sortie avant la fin du terme."],
      actionHref: "/employer/employees",
      actionLabel: "Ouvrir le registre",
    };
  }

  return {
    id: `docs-${Date.now()}`,
    question,
    title: `${employeesWithMissingDocs.length} dossier(s) RH incomplet(s)`,
    summary:
      employeesWithMissingDocs.length > 0
        ? "Completez les pieces critiques avant signature, paie ou controle."
        : "Les dossiers salaries actifs ont les pieces principales cochees.",
    risk: employeesWithMissingDocs.length > 0 ? "high" : "low",
    bullets:
      employeesWithMissingDocs.length > 0
        ? employeesWithMissingDocs
            .slice(0, 4)
            .map((employee) => `${employee.fullName}: ${missingDocuments(employee).map((item) => item.label).join(", ")}`)
        : ["Contrat, CIN, CNSS, RIB et certificat medical sont suivis dans le registre.", "Continuez le controle a chaque entree."],
    actionHref: "/employer/employees",
    actionLabel: "Completer les dossiers",
  };
}

export function EmployerAssistantClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<EmployerLeaveRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<EmployerTimeEntry[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<EmployerPayrollRun[]>([]);
  const [question, setQuestion] = useState(promptChips[0]);
  const [answers, setAnswers] = useState<AssistantAnswer[]>([]);

  useEffect(() => {
    setEmployees(parseList<EmployerEmployee>(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY)) ?? []);
    setLeaveRequests(parseList<EmployerLeaveRequest>(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY)) ?? []);
    setTimeEntries(parseList<EmployerTimeEntry>(readEmployerScopedValue(EMPLOYER_TIME_ENTRY_STORAGE_KEY)) ?? []);
    setPayrollRuns(parseList<EmployerPayrollRun>(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY)) ?? []);
  }, []);

  const context = useMemo(() => {
    const activeEmployees = employees.filter((employee) => employee.status !== "Sorti");
    return {
      employees: activeEmployees.length,
      missingDocs: activeEmployees.filter((employee) => missingDocuments(employee).length > 0).length,
      pendingLeaves: leaveRequests.filter((request) => request.status === "pending").length,
      pendingTime: timeEntries.filter((entry) => entry.status === "draft").length,
    };
  }, [employees, leaveRequests, timeEntries]);

  function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setAnswers((current) => [buildAnswer(trimmed, employees, leaveRequests, timeEntries, payrollRuns), ...current].slice(0, 6));
  }

  function askChip(value: string) {
    setQuestion(value);
    setAnswers((current) => [buildAnswer(value, employees, leaveRequests, timeEntries, payrollRuns), ...current].slice(0, 6));
  }

  const latestAnswer = answers[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Contexte</p>
              <h2 className="mt-2 text-xl font-black">Signaux RH</h2>
            </div>
            <BrainCircuit className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold text-[var(--ink-soft)]">Salaries actifs</p>
              <p className="mt-2 text-2xl font-black">{context.employees}</p>
            </div>
            <div className="rounded-lg bg-[var(--err-bg)] p-4">
              <p className="text-xs font-bold text-[var(--err)]">Dossiers incomplets</p>
              <p className="mt-2 text-2xl font-black text-[var(--err)]">{context.missingDocs}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[var(--warning-soft)] p-4">
                <p className="text-xs font-bold text-[#8a520f]">Conges</p>
                <p className="mt-2 text-2xl font-black text-[#8a520f]">{context.pendingLeaves}</p>
              </div>
              <div className="rounded-lg bg-[var(--accent-soft)] p-4">
                <p className="text-xs font-bold text-[var(--accent)]">Pointage</p>
                <p className="mt-2 text-2xl font-black text-[var(--accent)]">{context.pendingTime}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Raccourcis</p>
          <div className="mt-4 grid gap-2">
            {promptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => askChip(chip)}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-left text-sm font-bold text-[var(--heading)] hover:bg-[var(--surface-muted)]"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <form onSubmit={submitQuestion} className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Question RH</span>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="input-shell"
              placeholder="Posez une question RH"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-[var(--juris-on-primary)]"
          >
            <Send className="h-4 w-4" />
            Analyser
          </button>
        </form>

        <div className="mt-6 grid gap-4">
          {latestAnswer ? (
            <article className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--ink-soft)]">{latestAnswer.question}</p>
                  <h2 className="mt-2 text-2xl font-black">{latestAnswer.title}</h2>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${riskClass(latestAnswer.risk)}`}>
                  {riskLabel(latestAnswer.risk)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">{latestAnswer.summary}</p>
              <ul className="mt-4 grid gap-2 text-sm text-[var(--heading)]">
                {latestAnswer.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={latestAnswer.actionHref}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-black hover:bg-[var(--surface)]"
              >
                {latestAnswer.actionLabel}
              </Link>
            </article>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-8 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-[var(--accent)]" />
              <p className="mt-3 text-lg font-black">Posez une question RH</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Les reponses utilisent les donnees disponibles dans le portail employeur.
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/employer/employees" className="rounded-lg border border-[var(--line)] p-4 hover:bg-[var(--surface-muted)]">
              <ClipboardList className="h-5 w-5 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-black">Registre</p>
            </Link>
            <Link href="/employer/payroll" className="rounded-lg border border-[var(--line)] p-4 hover:bg-[var(--surface-muted)]">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-black">Paie</p>
            </Link>
            <Link href="/employer/leave" className="rounded-lg border border-[var(--line)] p-4 hover:bg-[var(--surface-muted)]">
              <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-black">Conges</p>
            </Link>
            <Link href="/employer/time" className="rounded-lg border border-[var(--line)] p-4 hover:bg-[var(--surface-muted)]">
              <Timer className="h-5 w-5 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-black">Pointage</p>
            </Link>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                Les analyses sont des controles operationnels MONRH. Une decision disciplinaire, un licenciement ou un
                litige doit etre valide avec un conseil qualifie.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
