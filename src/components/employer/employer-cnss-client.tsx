"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import {
  employerPlanCapabilities,
  employerPlanLabels,
  type EmployerCnssExport,
  type EmployerCnssRow,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerPayrollRun,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies } from "@/lib/employer/company-store";
import {
  fetchEmployerCnssExportsFromCloud,
  readEmployerCnssExports,
  saveEmployerCnssExportToCloud,
  writeEmployerCnssExports,
} from "@/lib/employer/cnss-store";
import { readEmployerEmployees } from "@/lib/employer/employee-store";
import { readEmployerPayrollRuns } from "@/lib/employer/payroll-store";

const DEFAULT_CNSS_DECLARED_DAYS = 26;

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function clampDeclaredDays(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_CNSS_DECLARED_DAYS;
  return Math.min(31, Math.max(0, Math.round(value)));
}

function buildCnssRows(
  run: EmployerPayrollRun | null,
  employees: EmployerEmployee[],
  declaredDaysByEmployee: Record<string, number>,
): EmployerCnssRow[] {
  if (!run) {
    return employees.map((employee) => ({
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeCin: employee.cin ?? "",
      cnssNumber: employee.cnssNumber,
      contractType: employee.contractType,
      gross: employee.grossSalary,
      declaredDays: clampDeclaredDays(declaredDaysByEmployee[employee.id] ?? DEFAULT_CNSS_DECLARED_DAYS),
      cnssBase: Math.min(employee.grossSalary, 6000),
      cnssEmployee: 0,
      cnssEmployer: 0,
      totalCnss: 0,
    }));
  }

  return run.lines.map((line) => {
    const employee = employees.find((item) => item.id === line.employeeId);
    const cnssEmployee = line.result.deductions.cnssEmployee;
    const cnssEmployer = line.result.employerContributions.cnssEmployer;
    return {
      employeeId: line.employeeId,
      employeeName: line.employeeName,
      employeeCin: employee?.cin ?? "",
      cnssNumber: employee?.cnssNumber ?? "A completer",
      contractType: employee?.contractType ?? "-",
      gross: line.result.earnings.totalGross,
      declaredDays: clampDeclaredDays(declaredDaysByEmployee[line.employeeId] ?? DEFAULT_CNSS_DECLARED_DAYS),
      cnssBase: Math.min(line.result.earnings.totalGross, 6000),
      cnssEmployee,
      cnssEmployer,
      totalCnss: cnssEmployee + cnssEmployer,
    };
  });
}

function getFilenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? fallback;
}

async function downloadCnssCsv(companyId: string, exportId: string, fallbackFilename: string) {
  const response = await fetch("/api/employer/cnss-export-csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, exportId }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? "Export CSV CNSS refuse par le serveur.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getFilenameFromDisposition(response.headers.get("content-disposition"), fallbackFilename);
  anchor.click();
  URL.revokeObjectURL(url);
}

function declarationStatusClass(tone: "ready" | "warning" | "blocked" | "done") {
  if (tone === "ready") return "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]";
  if (tone === "done") return "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]";
  if (tone === "blocked") return "border-[var(--err)] bg-[var(--err-bg)] text-[var(--err)]";
  return "border-[var(--warning-line)] bg-[var(--warning-soft)] text-[#8a520f]";
}

function replaceCnssExportInList(exports: EmployerCnssExport[], cnssExport: EmployerCnssExport) {
  return exports.some((item) => item.id === cnssExport.id)
    ? exports.map((item) => (item.id === cnssExport.id ? cnssExport : item))
    : [cnssExport, ...exports];
}

export function EmployerCnssClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [runs, setRuns] = useState<EmployerPayrollRun[]>([]);
  const [exports, setExports] = useState<EmployerCnssExport[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [query, setQuery] = useState("");
  const [declaredDaysByEmployee, setDeclaredDaysByEmployee] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextEmployees = readEmployerEmployees();
    const nextRuns = readEmployerPayrollRuns();
    const nextExports = readEmployerCnssExports();
    const nextCompanies = readEmployerCompanies();
    const nextActiveCompany = getActiveEmployerCompany(nextCompanies);
    setEmployees(nextEmployees ?? []);
    setRuns(nextRuns);
    setExports(nextExports);
    setSelectedRunId(nextRuns[0]?.id ?? "");
    setActiveCompany(nextActiveCompany);
    if (!nextActiveCompany) return;

    let cancelled = false;
    fetchEmployerCnssExportsFromCloud(nextActiveCompany.id)
      .then((cloudExports) => {
        if (cancelled || !cloudExports) return;
        setExports(cloudExports);
        writeEmployerCnssExports(cloudExports);
      })
      .catch(() => {
        if (!cancelled) setMessage("Exports CNSS cloud indisponibles, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );

  const period = selectedRun?.period ?? "Brouillon registre";
  const selectedExport = exports.find((item) =>
    selectedRun ? item.payrollRunId === selectedRun.id : item.period === period,
  );
  useEffect(() => {
    if (!selectedExport) {
      setDeclaredDaysByEmployee({});
      return;
    }
    setDeclaredDaysByEmployee(
      selectedExport.rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.employeeId] = clampDeclaredDays(row.declaredDays);
        return acc;
      }, {}),
    );
  }, [selectedExport?.id]);

  const rows = useMemo(
    () => buildCnssRows(selectedRun, employees, declaredDaysByEmployee),
    [declaredDaysByEmployee, employees, selectedRun],
  );
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.employeeName, row.cnssNumber, row.contractType].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [query, rows]);

  const totals = useMemo(
    () => ({
      employees: rows.length,
      gross: rows.reduce((sum, row) => sum + row.gross, 0),
      cnssBase: rows.reduce((sum, row) => sum + row.cnssBase, 0),
      cnssEmployee: rows.reduce((sum, row) => sum + row.cnssEmployee, 0),
      cnssEmployer: rows.reduce((sum, row) => sum + row.cnssEmployer, 0),
      totalCnss: rows.reduce((sum, row) => sum + row.totalCnss, 0),
      missingCnss: rows.filter((row) => row.cnssNumber === "A completer" || !row.cnssNumber.trim()).length,
    }),
    [rows],
  );
  if (!activeCompany) return null;
  const company = activeCompany;

  const canExportCsv = employerPlanCapabilities[company.plan].canExportCsv;
  const incomeTaxWithheld = selectedRun?.lines.reduce((sum, line) => sum + line.result.deductions.incomeTax, 0) ?? 0;
  const declarationStatus = !selectedRun
    ? {
        label: "Paie requise",
        tone: "warning" as const,
        detail: "Calculez une paie mensuelle pour alimenter les montants declaratifs.",
      }
    : totals.missingCnss > 0
      ? {
          label: "Donnees a completer",
          tone: "blocked" as const,
          detail: `${totals.missingCnss} numero(s) CNSS manquant(s) avant un depot propre.`,
        }
      : selectedExport
        ? {
            label: "Export prepare",
            tone: "done" as const,
            detail: `${selectedExport.filename} enregistre pour cette paie.`,
          }
        : {
            label: "Pret a exporter",
            tone: "ready" as const,
            detail: "La paie source et les numeros CNSS sont controles pour ce mois.",
          };

  function updateDeclaredDays(employeeId: string, value: string) {
    setDeclaredDaysByEmployee((current) => ({
      ...current,
      [employeeId]: clampDeclaredDays(Number(value)),
    }));
  }

  function createExport(filename: string): EmployerCnssExport {
    return {
      id: crypto.randomUUID(),
      payrollRunId: selectedRun?.id,
      period,
      filename,
      status: "downloaded",
      createdAt: new Date().toISOString(),
      rows,
      totals,
    };
  }

  async function exportCsv() {
    if (!canExportCsv) {
      setMessage("Export CSV verrouille sur le plan Free. Passez au plan Pro pour telecharger le bordereau.");
      return;
    }
    if (rows.length === 0) {
      setMessage("Aucune ligne CNSS a exporter.");
      return;
    }
    if (!selectedRun) {
      setMessage("Selectionnez une paie calculee avant de telecharger le CSV CNSS.");
      return;
    }
    const safePeriod = period.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "periode";
    const filename = `cnss-${safePeriod}.csv`;
    const nextExport = createExport(filename);

    try {
      const savedExport = await saveEmployerCnssExportToCloud(company.id, nextExport);
      if (!savedExport) throw new Error("unauthorized");
      await downloadCnssCsv(company.id, savedExport.id, savedExport.filename);
      setExports((current) => {
        const nextExports = replaceCnssExportInList(current, savedExport).slice(0, 24);
        writeEmployerCnssExports(nextExports);
        return nextExports;
      });
      setMessage(`CSV CNSS prepare pour ${rows.length} salarie(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export CSV CNSS indisponible.");
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Export</p>
              <h2 className="mt-2 text-xl font-black">Bordereau CNSS</h2>
            </div>
            <FileSpreadsheet className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Paie source</span>
              <select
                value={selectedRunId}
                onChange={(event) => setSelectedRunId(event.target.value)}
                className="input-shell mt-1"
              >
                {runs.length === 0 ? <option value="">Aucune paie calculee</option> : null}
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.period} - {run.lines.length} salarie(s)
                  </option>
                ))}
              </select>
            </label>

            {runs.length === 0 ? (
              <div className="rounded-lg bg-[var(--warning-soft)] p-3 text-sm text-[#8a520f]">
                Aucun calcul de paie trouve. Le tableau affiche un brouillon depuis le registre, sans cotisations.
              </div>
            ) : null}

            <button
              type="button"
              onClick={exportCsv}
              disabled={!canExportCsv || !selectedRun || totals.missingCnss > 0}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="mr-2 h-4 w-4" />
              {canExportCsv ? "Telecharger CSV" : "CSV Pro"}
            </button>
            {!canExportCsv ? (
              <Link
                href="/employer/settings"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--warning-line)] bg-[var(--warning-soft)] px-3 text-sm font-bold text-[#8a520f]"
              >
                Debloquer avec Pro
              </Link>
            ) : null}

            <Link
              href="/employer/payroll"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              Calculer une paie
            </Link>

            {message ? (
              <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Controle</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ink-soft)]">Periode</span>
              <span className="min-w-0 text-right font-bold">{period}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ink-soft)]">Plan</span>
              <span className="font-bold">{employerPlanLabels[company.plan]}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ink-soft)]">Salaries</span>
              <span className="font-bold">{totals.employees}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ink-soft)]">CNSS manquants</span>
              <span className={`font-bold ${totals.missingCnss > 0 ? "text-[var(--err)]" : "text-[var(--ok)]"}`}>
                {totals.missingCnss}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Historique</p>
          <div className="mt-4 space-y-3">
            {exports.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun export CNSS enregistre pour le contexte actif.</p>
            ) : (
              exports.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.payrollRunId) setSelectedRunId(item.payrollRunId);
                    setMessage(`${item.filename} - ${item.totals.employees} salarie(s).`);
                  }}
                  className="block w-full rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-left transition hover:border-[var(--accent)]"
                >
                  <p className="text-sm font-black">{item.period}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {item.totals.employees} salarie(s) - {new Date(item.createdAt).toLocaleString("fr-MA")}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Mois actif</p>
              <h2 className="mt-2 text-xl font-black">Declarations {period}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                La V1 assemble les controles et recaps issus de la paie. Le depot Damancom reste une action
                externe tant que la transmission automatisee n est pas branchee.
              </p>
            </div>
            <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${declarationStatusClass(declarationStatus.tone)}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.14em]">Statut CNSS</p>
              <p className="mt-1 text-base">{declarationStatus.label}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">CNSS</p>
              <p className="mt-2 text-lg font-black">{declarationStatus.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{declarationStatus.detail}</p>
            </article>
            <article className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">Damancom</p>
              <p className="mt-2 text-lg font-black">{selectedRun ? "Preparation structuree" : "En attente de paie"}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {selectedRun
                  ? "Le run de paie fournit les lignes a verifier avant depot manuel."
                  : "Le run mensuel doit exister avant de preparer le recap declaratif."}
              </p>
            </article>
            <article className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">IR retenu</p>
              <p className="mt-2 text-lg font-black">{formatMoney(incomeTaxWithheld)}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Recap IR issu de la paie pour rapprochement mensuel avant declaration fiscale.
              </p>
            </article>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Masse brute</p>
            <p className="mt-2 break-words text-2xl font-black">{formatMoney(totals.gross)}</p>
          </div>
          <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Base CNSS</p>
            <p className="mt-2 break-words text-2xl font-black">{formatMoney(totals.cnssBase)}</p>
          </div>
          <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Part salarie</p>
            <p className="mt-2 break-words text-2xl font-black">{formatMoney(totals.cnssEmployee)}</p>
          </div>
          <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Total CNSS</p>
            <p className="mt-2 break-words text-2xl font-black">{formatMoney(totals.totalCnss)}</p>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex min-w-0 flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Recapitulatif</p>
              <h2 className="mt-2 text-xl font-black">Declaration mensuelle</h2>
            </div>
            <label className="relative lg:shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input-shell h-10 w-full min-w-0 pl-9 sm:w-64"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Rechercher"
              />
            </label>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                <tr>
                  <th className="px-5 py-3">Salarie</th>
                  <th className="px-5 py-3">CNSS</th>
                  <th className="px-5 py-3">Contrat</th>
                  <th className="px-5 py-3">Jours</th>
                  <th className="px-5 py-3">Brut</th>
                  <th className="px-5 py-3">Base CNSS</th>
                  <th className="px-5 py-3">Part salarie</th>
                  <th className="px-5 py-3">Part employeur</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredRows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="px-5 py-4 font-black">{row.employeeName}</td>
                    <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">{row.cnssNumber}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                        {row.contractType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={row.declaredDays}
                        onChange={(event) => updateDeclaredDays(row.employeeId, event.target.value)}
                        className="input-shell h-9 w-20 text-sm"
                        aria-label={`Jours declares ${row.employeeName}`}
                      />
                    </td>
                    <td className="px-5 py-4">{formatMoney(row.gross)}</td>
                    <td className="px-5 py-4">{formatMoney(row.cnssBase)}</td>
                    <td className="px-5 py-4">{formatMoney(row.cnssEmployee)}</td>
                    <td className="px-5 py-4">{formatMoney(row.cnssEmployer)}</td>
                    <td className="px-5 py-4 font-black">{formatMoney(row.totalCnss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--ink-soft)]">Aucune ligne CNSS ne correspond a cette recherche.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
