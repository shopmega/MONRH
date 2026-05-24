"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Banknote, CalendarClock, Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  employerLeaveStatusLabels,
  employerLeaveTypeLabels,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerLeaveRequest,
  type EmployerPayrollRun,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies } from "@/lib/employer/company-store";
import { readEmployerEmployees } from "@/lib/employer/employee-store";
import { readEmployerLeaveRequests } from "@/lib/employer/leave-store";
import { readEmployerPayrollRuns } from "@/lib/employer/payroll-store";
import { readEmployerPayrollSettings } from "@/lib/employer/payroll-settings-store";

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value);
}

function accruedPaidLeave(startDate: string) {
  const started = new Date(startDate);
  if (Number.isNaN(started.getTime())) return { accrued: 0, seniorityBonus: 0 };
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth());
  const years = Math.max(0, now.getFullYear() - started.getFullYear());
  const seniorityBonus = Math.floor(years / 5) * 1.5;
  return { accrued: Math.round((months * 1.5 + seniorityBonus) * 10) / 10, seniorityBonus };
}

function exportCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvAmount(value: number) {
  return value.toFixed(2);
}

type AccountingJournalLine = {
  journal: string;
  date: string;
  period: string;
  matricule?: string;
  employeeName?: string;
  account: string;
  label: string;
  debit: number;
  credit: number;
};

function accountingTemplateSuffix(template: ReturnType<typeof readEmployerPayrollSettings>["accountingExportTemplate"]) {
  return template === "generic" ? "generic" : template;
}

function formatAccountingJournalRows(
  lines: AccountingJournalLine[],
  template: ReturnType<typeof readEmployerPayrollSettings>["accountingExportTemplate"],
  perEmployee: boolean,
) {
  if (template === "odoo") {
    return [
      ["Date", "Journal", "Account", "Partner", "Label", "Debit", "Credit", "Analytic Account"],
      ...lines.map((line) => [
        line.date,
        line.journal,
        line.account,
        line.employeeName ?? "",
        line.label,
        csvAmount(line.debit),
        csvAmount(line.credit),
        line.matricule ?? "",
      ]),
    ];
  }

  if (template === "sage") {
    return [
      ["Code journal", "Date piece", "Numero compte", "Libelle ecriture", "Debit", "Credit", "Section analytique"],
      ...lines.map((line) => [
        line.journal,
        line.date,
        line.account,
        line.label,
        csvAmount(line.debit),
        csvAmount(line.credit),
        line.matricule ?? "",
      ]),
    ];
  }

  if (template === "webisoft") {
    return [
      ["Journal", "Date", "Compte", "Libelle", "Debit", "Credit", "Matricule", "Salarie"],
      ...lines.map((line) => [
        line.journal,
        line.date,
        line.account,
        line.label,
        csvAmount(line.debit),
        csvAmount(line.credit),
        line.matricule ?? "",
        line.employeeName ?? "",
      ]),
    ];
  }

  return [
    perEmployee
      ? ["Journal", "Date", "Periode", "Matricule", "Salarie", "Compte", "Libelle", "Debit", "Credit"]
      : ["Journal", "Date", "Periode", "Compte", "Libelle", "Debit", "Credit"],
    ...lines.map((line) =>
      perEmployee
        ? [
            line.journal,
            line.date,
            line.period,
            line.matricule ?? "",
            line.employeeName ?? "",
            line.account,
            line.label,
            csvAmount(line.debit),
            csvAmount(line.credit),
          ]
        : [
            line.journal,
            line.date,
            line.period,
            line.account,
            line.label,
            csvAmount(line.debit),
            csvAmount(line.credit),
          ],
    ),
  ];
}

export function EmployerReportsClient() {
  const [company, setCompany] = useState<EmployerCompany | null>(null);
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [runs, setRuns] = useState<EmployerPayrollRun[]>([]);
  const [leaves, setLeaves] = useState<EmployerLeaveRequest[]>([]);

  useEffect(() => {
    setCompany(getActiveEmployerCompany(readEmployerCompanies()));
    setEmployees(readEmployerEmployees() ?? []);
    setRuns(readEmployerPayrollRuns());
    setLeaves(readEmployerLeaveRequests() ?? []);
  }, []);

  const latestRun = runs[0] ?? null;
  const settings = readEmployerPayrollSettings();

  const payrollBookRows = useMemo(() => {
    return runs.flatMap((run) =>
      run.lines.map((line) => ({
        period: run.period,
        employeeName: line.employeeName,
        gross: line.result.earnings.totalGross,
        cnss: line.result.deductions.cnssEmployee,
        amo: line.result.deductions.amoEmployee,
        ir: line.result.deductions.incomeTax,
        net: line.result.netToPay,
        employerCost: line.result.employerContributions.totalEmployerCost,
      })),
    );
  }, [runs]);

  const contributionTotals = useMemo(() => {
    const lines = latestRun?.lines ?? [];
    return {
      cnssEmployee: lines.reduce((sum, line) => sum + line.result.deductions.cnssEmployee, 0),
      cnssEmployer: lines.reduce((sum, line) => sum + line.result.employerContributions.cnssEmployer, 0),
      amoEmployee: lines.reduce((sum, line) => sum + line.result.deductions.amoEmployee, 0),
      amoEmployer: lines.reduce((sum, line) => sum + line.result.employerContributions.amoEmployer, 0),
      ir: lines.reduce((sum, line) => sum + line.result.deductions.incomeTax, 0),
      formation: lines.reduce((sum, line) => sum + line.result.employerContributions.formationPro, 0),
    };
  }, [latestRun]);

  const cashRows = useMemo(() => {
    return (latestRun?.lines ?? []).map((line) => ({
      employeeName: line.employeeName,
      net: line.result.netToPay,
      method: settings.paymentMethod === "bank_transfer" ? "Virement" : settings.paymentMethod === "cash" ? "Especes" : "Mixte",
      status: "A payer",
    }));
  }, [latestRun, settings.paymentMethod]);

  const leaveRows = useMemo(() => {
    return employees.map((employee) => {
      const employeeLeaves = leaves.filter((leave) => leave.employeeId === employee.id);
      const approvedPaid = employeeLeaves
        .filter((leave) => leave.status === "approved" && leave.type === "paid")
        .reduce((sum, leave) => sum + leave.days, 0);
      const pendingPaid = employeeLeaves
        .filter((leave) => leave.status === "pending" && leave.type === "paid")
        .reduce((sum, leave) => sum + leave.days, 0);
      const accrual = accruedPaidLeave(employee.startDate);
      return {
        employee,
        accrued: accrual.accrued,
        seniorityBonus: accrual.seniorityBonus,
        approvedPaid,
        pendingPaid,
        balance: Math.max(0, accrual.accrued - approvedPaid),
      };
    });
  }, [employees, leaves]);

  if (!company) return null;

  const reportCards: { label: string; value: string | number; icon: LucideIcon }[] = [
    { label: "Livre de paie", value: payrollBookRows.length, icon: FileText },
    {
      label: "Cotisations",
      value: formatMoney(Object.values(contributionTotals).reduce((sum, value) => sum + value, 0)),
      icon: FileSpreadsheet,
    },
    { label: "Etat de caisse", value: formatMoney(cashRows.reduce((sum, row) => sum + row.net, 0)), icon: Banknote },
    { label: "Etat de conges", value: `${leaveRows.length} salaries`, icon: CalendarClock },
  ];

  function exportPayrollBook() {
    exportCsv("livre-paie.csv", [
      ["Periode", "Salarie", "Brut", "CNSS", "AMO", "IR", "Net", "Cout employeur"],
      ...payrollBookRows.map((row) => [
        row.period,
        row.employeeName,
        String(row.gross),
        String(row.cnss),
        String(row.amo),
        String(row.ir),
        String(row.net),
        String(row.employerCost),
      ]),
    ]);
  }

  function exportAccountingJournal() {
    if (!latestRun) return;
    const accounts = settings.accountingAccounts;
    const lines = latestRun.lines;
    const gross = lines.reduce((sum, line) => sum + line.result.earnings.totalGross, 0);
    const net = lines.reduce((sum, line) => sum + line.result.netToPay, 0);
    const cnssEmployee = lines.reduce((sum, line) => sum + line.result.deductions.cnssEmployee, 0);
    const amoEmployee = lines.reduce((sum, line) => sum + line.result.deductions.amoEmployee, 0);
    const cimrEmployee = lines.reduce((sum, line) => sum + (line.result.deductions.cimrEmployee ?? 0), 0);
    const ir = lines.reduce((sum, line) => sum + line.result.deductions.incomeTax, 0);
    const cnssEmployer = lines.reduce((sum, line) => sum + line.result.employerContributions.cnssEmployer, 0);
    const amoEmployer = lines.reduce((sum, line) => sum + line.result.employerContributions.amoEmployer, 0);
    const formation = lines.reduce((sum, line) => sum + line.result.employerContributions.formationPro, 0);
    const employerCharges = cnssEmployer + amoEmployer + formation;
    const socialPayable = cnssEmployee + amoEmployee + cnssEmployer + amoEmployer + formation;
    const journalDate = new Date(latestRun.createdAt).toISOString().slice(0, 10);
    const label = `Paie ${latestRun.period}`;
    const rows: AccountingJournalLine[] = [
      { journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.grossSalaryExpense, label: `${label} - salaires bruts`, debit: gross, credit: 0 },
      { journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.employerSocialChargesExpense, label: `${label} - charges sociales patronales`, debit: employerCharges, credit: 0 },
      { journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.socialPayable, label: `${label} - CNSS/AMO/OFPPT a payer`, debit: 0, credit: socialPayable },
      { journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.incomeTaxPayable, label: `${label} - IR salaires a payer`, debit: 0, credit: ir },
      ...(cimrEmployee > 0
        ? [{ journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.cimrPayable, label: `${label} - CIMR a payer`, debit: 0, credit: cimrEmployee }]
        : []),
      { journal: "PAIE", date: journalDate, period: latestRun.period, account: accounts.netSalaryPayable, label: `${label} - salaires nets a payer`, debit: 0, credit: net },
    ];
    exportCsv(
      `journal-paie-${accountingTemplateSuffix(settings.accountingExportTemplate)}-${latestRun.period.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`,
      formatAccountingJournalRows(rows, settings.accountingExportTemplate, false),
    );
  }

  function exportEmployeeAccountingJournal() {
    if (!latestRun) return;
    const accounts = settings.accountingAccounts;
    const journalDate = new Date(latestRun.createdAt).toISOString().slice(0, 10);
    const rows = latestRun.lines.flatMap((line) => {
      const employee = employees.find((item) => item.id === line.employeeId);
      const employeeRef = employee?.employeeNumber ?? line.employeeId;
      const gross = line.result.earnings.totalGross;
      const net = line.result.netToPay;
      const cnssEmployee = line.result.deductions.cnssEmployee;
      const amoEmployee = line.result.deductions.amoEmployee;
      const cimrEmployee = line.result.deductions.cimrEmployee ?? 0;
      const ir = line.result.deductions.incomeTax;
      const cnssEmployer = line.result.employerContributions.cnssEmployer;
      const amoEmployer = line.result.employerContributions.amoEmployer;
      const formation = line.result.employerContributions.formationPro;
      const employerCharges = cnssEmployer + amoEmployer + formation;
      const socialPayable = cnssEmployee + amoEmployee + cnssEmployer + amoEmployer + formation;
      const label = `Paie ${latestRun.period} - ${employeeRef} - ${line.employeeName}`;

      return [
        { journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.grossSalaryExpense, label: `${label} - salaire brut`, debit: gross, credit: 0 },
        { journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.employerSocialChargesExpense, label: `${label} - charges patronales`, debit: employerCharges, credit: 0 },
        { journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.socialPayable, label: `${label} - CNSS/AMO/OFPPT`, debit: 0, credit: socialPayable },
        { journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.incomeTaxPayable, label: `${label} - IR salaire`, debit: 0, credit: ir },
        ...(cimrEmployee > 0
          ? [{ journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.cimrPayable, label: `${label} - CIMR`, debit: 0, credit: cimrEmployee }]
          : []),
        { journal: "PAIE", date: journalDate, period: latestRun.period, matricule: employeeRef, employeeName: line.employeeName, account: accounts.netSalaryPayable, label: `${label} - net a payer`, debit: 0, credit: net },
      ];
    });

    exportCsv(
      `journal-paie-par-salarie-${accountingTemplateSuffix(settings.accountingExportTemplate)}-${latestRun.period.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`,
      formatAccountingJournalRows(rows, settings.accountingExportTemplate, true),
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {reportCards.map(({ label, value, icon: Icon }) => (
          <section key={label} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <Icon className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-bold text-[var(--ink-soft)]">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5">
          <div>
            <h2 className="text-xl font-black">Livre de paie</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Historique detaille des runs de paie par salarie.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportPayrollBook} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-black hover:bg-[var(--surface-muted)]">
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={exportAccountingJournal}
              disabled={!latestRun}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-black hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Journal comptable
            </button>
            <button
              type="button"
              onClick={exportEmployeeAccountingJournal}
              disabled={!latestRun}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-black hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Journal par salarie
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <tr>{["Periode", "Salarie", "Brut", "CNSS", "AMO", "IR", "Net", "Cout employeur"].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {payrollBookRows.map((row, index) => (
                <tr key={`${row.period}-${row.employeeName}-${index}`}>
                  <td className="px-5 py-4">{row.period}</td>
                  <td className="px-5 py-4 font-black">{row.employeeName}</td>
                  <td className="px-5 py-4">{formatMoney(row.gross)}</td>
                  <td className="px-5 py-4">{formatMoney(row.cnss)}</td>
                  <td className="px-5 py-4">{formatMoney(row.amo)}</td>
                  <td className="px-5 py-4">{formatMoney(row.ir)}</td>
                  <td className="px-5 py-4 font-black text-[var(--ok)]">{formatMoney(row.net)}</td>
                  <td className="px-5 py-4">{formatMoney(row.employerCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-xl font-black">Etat resume des cotisations</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{latestRun ? latestRun.period : "Aucun run disponible"}</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {Object.entries({
              "CNSS salarie": contributionTotals.cnssEmployee,
              "CNSS employeur": contributionTotals.cnssEmployer,
              "AMO salarie": contributionTotals.amoEmployee,
              "AMO employeur": contributionTotals.amoEmployer,
              IR: contributionTotals.ir,
              "Formation professionnelle": contributionTotals.formation,
            }).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[var(--surface-muted)] p-3">
                <dt className="text-xs font-bold text-[var(--ink-soft)]">{label}</dt>
                <dd className="mt-1 text-lg font-black">{formatMoney(value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-xl font-black">Etat de caisse</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Net a payer par salarie et mode de paiement par defaut.</p>
          <div className="mt-5 space-y-3">
            {cashRows.map((row) => (
              <div key={row.employeeName} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-muted)] p-3">
                <div>
                  <p className="font-black">{row.employeeName}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{row.method} - {row.status}</p>
                </div>
                <p className="font-black">{formatMoney(row.net)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-xl font-black">Etat de conges</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Acquis legal mensuel, bonus anciennete, pris, en attente et solde.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <tr>{["Salarie", "Acquis", "Bonus anciennete", "Pris", "En attente", "Solde"].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {leaveRows.map((row) => (
                <tr key={row.employee.id}>
                  <td className="px-5 py-4 font-black">{row.employee.fullName}</td>
                  <td className="px-5 py-4">{row.accrued.toFixed(1)} j</td>
                  <td className="px-5 py-4">{row.seniorityBonus.toFixed(1)} j</td>
                  <td className="px-5 py-4">{row.approvedPaid.toFixed(1)} j</td>
                  <td className="px-5 py-4">{row.pendingPaid.toFixed(1)} j</td>
                  <td className="px-5 py-4 font-black">{row.balance.toFixed(1)} j</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="text-xl font-black">Journal des absences</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {leaves.map((leave) => (
            <article key={leave.id} className="rounded-lg bg-[var(--surface-muted)] p-4">
              <p className="font-black">{leave.employeeName}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {employerLeaveTypeLabels[leave.type]} - {employerLeaveStatusLabels[leave.status]} - {leave.days} j
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
