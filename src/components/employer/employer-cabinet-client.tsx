"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Building2, CheckCircle2, FileSpreadsheet, FileText, Lock, Settings, Users } from "lucide-react";
import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
  employerDocumentChecklist,
  employerPlanCapabilities,
  employerPlanLabels,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
  type EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import {
  getActiveEmployerCompany,
  readEmployerScopedValue,
  readEmployerCompanies,
  writeActiveEmployerCompanyId,
  writeEmployerCompanies,
} from "@/lib/employer/company-store";

type PortfolioRow = {
  company: EmployerCompany;
  employees: number;
  payrollStatus: "ready" | "missing" | "review";
  cnssStatus: "ready" | "missing";
  pendingActions: number;
  revenueLabel: string;
};

type PortfolioData = {
  employees: EmployerEmployee[];
  payrollRuns: EmployerPayrollRun[];
  leaveRequests: EmployerLeaveRequest[];
  timeEntries: EmployerTimeEntry[];
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

function statusClass(status: PortfolioRow["payrollStatus"] | PortfolioRow["cnssStatus"]) {
  if (status === "ready") return "bg-[var(--ok-bg)] text-[var(--ok)]";
  if (status === "review") return "bg-[var(--warning-soft)] text-[#8a520f]";
  return "bg-[var(--err-bg)] text-[var(--err)]";
}

function statusLabel(status: PortfolioRow["payrollStatus"] | PortfolioRow["cnssStatus"]) {
  if (status === "ready") return "Pret";
  if (status === "review") return "A revoir";
  return "Manquant";
}

function readScopedList<T>(baseKey: string, companyId: string): T[] {
  return parseList<T>(readEmployerScopedValue(baseKey, companyId)) ?? [];
}

function hasMissingDocuments(employee: EmployerEmployee) {
  return employerDocumentChecklist.some((document) => {
    const stored = employee.documents?.find((item) => item.type === document.type);
    return !(stored?.attached ?? false);
  });
}

function readPortfolioData(companies: EmployerCompany[]) {
  return companies.reduce<Record<string, PortfolioData>>((acc, company) => {
    acc[company.id] = {
      employees: readScopedList<EmployerEmployee>(EMPLOYER_EMPLOYEE_STORAGE_KEY, company.id),
      payrollRuns: readScopedList<EmployerPayrollRun>(EMPLOYER_PAYROLL_RUN_STORAGE_KEY, company.id),
      leaveRequests: readScopedList<EmployerLeaveRequest>(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY, company.id),
      timeEntries: readScopedList<EmployerTimeEntry>(EMPLOYER_TIME_ENTRY_STORAGE_KEY, company.id),
    };

    return acc;
  }, {});
}

function buildPortfolioRows(
  companies: EmployerCompany[],
  portfolioData: Record<string, PortfolioData>,
): PortfolioRow[] {
  return companies.map((company) => {
    const data = portfolioData[company.id] ?? { employees: [], payrollRuns: [], leaveRequests: [], timeEntries: [] };
    const activeEmployees = data.employees.filter((employee) => employee.status !== "Sorti");
    const latestRun = [...data.payrollRuns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const pendingActions =
      data.leaveRequests.filter((request) => request.status === "pending").length +
      data.timeEntries.filter((entry) => entry.status === "draft").length +
      activeEmployees.filter(hasMissingDocuments).length;
    const payrollStatus =
      !latestRun || activeEmployees.length === 0
        ? "missing"
        : latestRun.lines.length < activeEmployees.length
          ? "review"
          : "ready";
    const cnssStatus =
      latestRun && activeEmployees.every((employee) => employee.cnssNumber && employee.cnssNumber !== "A completer")
        ? "ready"
        : "missing";

    return {
      company,
      employees: activeEmployees.length,
      payrollStatus,
      cnssStatus,
      pendingActions,
      revenueLabel: company.plan === "cabinet" ? "Mandat actif" : "A convertir",
    };
  });
}

export function EmployerCabinetClient() {
  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [portfolioData, setPortfolioData] = useState<Record<string, PortfolioData>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    setCompanies(nextCompanies);
    setActiveCompany(getActiveEmployerCompany(nextCompanies));
    setPortfolioData(readPortfolioData(nextCompanies));
  }, []);

  if (!activeCompany) return null;

  const capabilities = employerPlanCapabilities[activeCompany.plan];
  const cabinetUnlocked = activeCompany.plan === "cabinet";
  const portfolioRows = useMemo(
    () => buildPortfolioRows(companies, portfolioData),
    [companies, portfolioData],
  );
  const totals = useMemo(
    () => ({
      employees: portfolioRows.reduce((sum, row) => sum + row.employees, 0),
      pendingActions: portfolioRows.reduce((sum, row) => sum + row.pendingActions, 0),
      readyPayroll: portfolioRows.filter((row) => row.payrollStatus === "ready").length,
      readyCnss: portfolioRows.filter((row) => row.cnssStatus === "ready").length,
    }),
    [portfolioRows],
  );

  function selectCompany(company: EmployerCompany) {
    writeActiveEmployerCompanyId(company.id);
    setActiveCompany(company);
    setMessage(`${company.name} est maintenant le contexte actif.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Cabinet</p>
              <h2 className="mt-2 text-xl font-black">Capacites actives</h2>
            </div>
            <Building2 className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="mt-5 rounded-lg bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-bold text-[var(--ink-soft)]">Plan actif</p>
            <p className="mt-2 text-2xl font-black">{employerPlanLabels[activeCompany.plan]}</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{activeCompany.name}</p>
          </div>

          <div className="mt-4 grid gap-3">
            {[
              ["Portefeuille", `${companies.length}/${capabilities.maxCompanies} entreprises`, cabinetUnlocked],
              ["Marque blanche", capabilities.canWhiteLabel ? "Debloquee" : "Verrouillee", capabilities.canWhiteLabel],
              ["Exports clients", capabilities.canExportCsv ? "CSV inclus" : "CSV verrouille", capabilities.canExportCsv],
              ["PDF bulletins", capabilities.canDownloadPayslips ? "PDF inclus" : "PDF verrouille", capabilities.canDownloadPayslips],
            ].map(([label, value, unlocked]) => (
              <div key={label as string} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] p-3">
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{value}</p>
                </div>
                {unlocked ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" />
                ) : (
                  <Lock className="h-5 w-5 text-[var(--err)]" />
                )}
              </div>
            ))}
          </div>

          {!cabinetUnlocked ? (
            <div className="mt-4 rounded-lg bg-[var(--warning-soft)] p-3 text-sm text-[#8a520f]">
              Passez le contexte actif au plan Cabinet RH dans les parametres pour debloquer le multi-entreprise complet.
            </div>
          ) : null}

          <Link
            href="/employer/settings"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-[var(--juris-on-primary)]"
          >
            <Settings className="h-4 w-4" />
            Gerer le portefeuille
          </Link>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Actions</p>
          <div className="mt-4 grid gap-2">
            <Link href="/employer/settings" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold hover:bg-[var(--surface-muted)]">
              Gerer entreprises & plan
            </Link>
            <Link href="/employer/payroll" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold hover:bg-[var(--surface-muted)]">
              Lancer paie client actif
            </Link>
            <Link href="/employer/cnss" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold hover:bg-[var(--surface-muted)]">
              Export CNSS client actif
            </Link>
          </div>
        </section>
      </aside>

      <section className="space-y-6">
        {message ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <Building2 className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Entreprises</p>
            <p className="mt-2 text-2xl font-black">{companies.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Salaries suivis</p>
            <p className="mt-2 text-2xl font-black">{totals.employees}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Paies pretes</p>
            <p className="mt-2 text-2xl font-black">{totals.readyPayroll}/{companies.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">Actions ouvertes</p>
            <p className="mt-2 text-2xl font-black">{totals.pendingActions}</p>
          </div>
        </div>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <h2 className="text-xl font-black">Portefeuille clients</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Selectionnez un client pour ouvrir les modules paie, registre, conges et CNSS dans son contexte.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Salaries</th>
                  <th className="px-5 py-3">Paie</th>
                  <th className="px-5 py-3">CNSS</th>
                  <th className="px-5 py-3">Actions</th>
                  <th className="px-5 py-3">Mandat</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {portfolioRows.map((row) => (
                  <tr key={row.company.id}>
                    <td className="px-5 py-4">
                      <p className="font-black">{row.company.name}</p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {row.company.city} - ICE {row.company.ice}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-bold">{row.employees}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(row.payrollStatus)}`}>
                        {statusLabel(row.payrollStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(row.cnssStatus)}`}>
                        {statusLabel(row.cnssStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold">{row.pendingActions}</td>
                    <td className="px-5 py-4 text-[var(--ink-soft)]">{row.revenueLabel}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => selectCompany(row.company)}
                        className="h-9 rounded-lg border border-[var(--line)] px-3 text-xs font-black hover:bg-[var(--surface-muted)]"
                      >
                        Activer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/employer/payroll" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">Paie client actif</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Calculer et historiser les bulletins.</p>
          </Link>
          <Link href="/employer/cnss" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">CNSS consolidee</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Verifier le recap avant depot.</p>
          </Link>
          <Link href="/employer/compliance" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-muted)]">
            <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-black">Alertes client</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Traiter les dossiers et echeances.</p>
          </Link>
        </section>
      </section>
    </div>
  );
}
