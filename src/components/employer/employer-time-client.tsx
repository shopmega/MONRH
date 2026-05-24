"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, Timer, Upload, XCircle } from "lucide-react";
import {
  employerTimeEntryStatusLabels,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerTimeEntry,
  type EmployerTimeEntryStatus,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies } from "@/lib/employer/company-store";
import { readEmployerEmployees } from "@/lib/employer/employee-store";
import {
  fetchEmployerTimeEntriesFromCloud,
  readEmployerTimeEntries,
  saveEmployerTimeEntriesToCloud,
  saveEmployerTimeEntryToCloud,
  writeEmployerTimeEntries,
} from "@/lib/employer/time-store";
import { parseCsvNumber, parseCsvRecords, readCsvField } from "@/lib/employer/csv";

type TimeFormState = {
  employeeId: string;
  weekStart: string;
  regularHours: string;
  overtimeDayHours: string;
  overtimeNightHours: string;
  overtimeRestOrHolidayDayHours: string;
  overtimeRestOrHolidayNightHours: string;
  note: string;
};

const emptyForm: TimeFormState = {
  employeeId: "",
  weekStart: "",
  regularHours: "44",
  overtimeDayHours: "0",
  overtimeNightHours: "0",
  overtimeRestOrHolidayDayHours: "0",
  overtimeRestOrHolidayNightHours: "0",
  note: "",
};

const MONTHLY_REFERENCE_HOURS = 191;
const OVERTIME_MULTIPLIERS = {
  day: 1.25,
  night: 1.5,
  restOrHolidayDay: 1.5,
  restOrHolidayNight: 2,
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMAD(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusClass(status: EmployerTimeEntryStatus) {
  if (status === "approved") return "bg-[var(--ok-bg)] text-[var(--ok)]";
  if (status === "rejected") return "bg-[var(--err-bg)] text-[var(--err)]";
  return "bg-[var(--warning-soft)] text-[#8a520f]";
}

function defaultWeekStart() {
  const today = new Date();
  const day = today.getDay() || 7;
  today.setDate(today.getDate() - day + 1);
  return today.toISOString().slice(0, 10);
}

function calculateOvertimeAmount(employee: EmployerEmployee | undefined, form: TimeFormState) {
  if (!employee) return 0;
  const hourlyRate = employee.grossSalary / MONTHLY_REFERENCE_HOURS;

  return roundMAD(
    toNumber(form.overtimeDayHours) * hourlyRate * OVERTIME_MULTIPLIERS.day +
      toNumber(form.overtimeNightHours) * hourlyRate * OVERTIME_MULTIPLIERS.night +
      toNumber(form.overtimeRestOrHolidayDayHours) *
        hourlyRate *
        OVERTIME_MULTIPLIERS.restOrHolidayDay +
      toNumber(form.overtimeRestOrHolidayNightHours) *
        hourlyRate *
        OVERTIME_MULTIPLIERS.restOrHolidayNight,
  );
}

function overtimeHours(form: TimeFormState) {
  return (
    toNumber(form.overtimeDayHours) +
    toNumber(form.overtimeNightHours) +
    toNumber(form.overtimeRestOrHolidayDayHours) +
    toNumber(form.overtimeRestOrHolidayNightHours)
  );
}

function replaceTimeEntryInList(entries: EmployerTimeEntry[], entry: EmployerTimeEntry) {
  return entries.some((item) => item.id === entry.id)
    ? entries.map((item) => (item.id === entry.id ? entry : item))
    : [entry, ...entries];
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeKey(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseTimeEntryStatus(value: string): EmployerTimeEntryStatus {
  const normalized = normalizeKey(value);
  if (normalized === "approved" || normalized === "approuve" || normalized === "approuvee") return "approved";
  if (normalized === "rejected" || normalized === "refuse" || normalized === "refusee") return "rejected";
  return "draft";
}

function parseDateField(value: string) {
  if (!value.trim()) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return value;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export function EmployerTimeClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [entries, setEntries] = useState<EmployerTimeEntry[]>([]);
  const [form, setForm] = useState<TimeFormState>({ ...emptyForm, weekStart: defaultWeekStart() });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    const nextActiveCompany = getActiveEmployerCompany(nextCompanies);
    const nextEmployees = readEmployerEmployees() ?? [];
    const nextEntries = readEmployerTimeEntries() ?? [];
    setActiveCompany(nextActiveCompany);
    setEmployees(nextEmployees);
    setEntries(nextEntries);
    setForm((current) => ({ ...current, employeeId: current.employeeId || nextEmployees[0]?.id || "" }));
    if (!nextActiveCompany) return;

    let cancelled = false;
    fetchEmployerTimeEntriesFromCloud(nextActiveCompany.id)
      .then((cloudEntries) => {
        if (cancelled || !cloudEntries) return;
        setEntries(cloudEntries);
        writeEmployerTimeEntries(cloudEntries);
      })
      .catch(() => {
        if (!cancelled) setMessage("Pointage cloud indisponible, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== "Sorti"), [employees]);
  const selectedEmployee = activeEmployees.find((employee) => employee.id === form.employeeId);
  const previewAmount = calculateOvertimeAmount(selectedEmployee, form);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...entries].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    if (!normalizedQuery) return sorted;
    return sorted.filter((entry) =>
      [entry.employeeName, entry.weekStart, employerTimeEntryStatusLabels[entry.status], entry.note]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [entries, query]);

  const totals = useMemo(() => {
    const approved = entries.filter((entry) => entry.status === "approved");
    return {
      pending: entries.filter((entry) => entry.status === "draft").length,
      approvedHours: approved.reduce(
        (sum, entry) =>
          sum +
          entry.overtimeDayHours +
          entry.overtimeNightHours +
          entry.overtimeRestOrHolidayDayHours +
          entry.overtimeRestOrHolidayNightHours,
        0,
      ),
      approvedAmount: approved.reduce((sum, entry) => sum + entry.overtimeAmount, 0),
    };
  }, [entries]);

  function updateForm<K extends keyof TimeFormState>(key: K, value: TimeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function persistTimeEntry(entry: EmployerTimeEntry, previousEntries: EmployerTimeEntry[], successMessage: string) {
    if (!activeCompany) return;
    try {
      const savedEntry = await saveEmployerTimeEntryToCloud(activeCompany.id, entry);
      if (!savedEntry) throw new Error("unauthorized");
      setEntries((current) => {
        const nextEntries = replaceTimeEntryInList(current, savedEntry);
        writeEmployerTimeEntries(nextEntries);
        return nextEntries;
      });
      setMessage(successMessage);
    } catch {
      setEntries(previousEntries);
      setMessage("Pointage non sauvegarde. Verifiez la connexion et reessayez.");
    }
  }

  function submitEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const employee = activeEmployees.find((item) => item.id === form.employeeId);
    if (!employee) {
      setMessage("Selectionnez un salarie avant d ajouter un pointage.");
      return;
    }
    if (!form.weekStart) {
      setMessage("Renseignez la semaine de pointage.");
      return;
    }
    const numericValues = [
      form.regularHours,
      form.overtimeDayHours,
      form.overtimeNightHours,
      form.overtimeRestOrHolidayDayHours,
      form.overtimeRestOrHolidayNightHours,
    ].map(toNumber);
    if (numericValues.some((value) => value < 0)) {
      setMessage("Les heures saisies ne peuvent pas etre negatives.");
      return;
    }
    if (toNumber(form.regularHours) <= 0 && overtimeHours(form) <= 0) {
      setMessage("Renseignez au moins des heures normales ou supplementaires.");
      return;
    }
    const duplicateEntry = entries.find(
      (entry) => entry.employeeId === employee.id && entry.weekStart === form.weekStart && entry.status !== "rejected",
    );
    if (duplicateEntry) {
      setMessage(`Un pointage existe deja pour ${employee.fullName} sur cette semaine.`);
      return;
    }

    const nextEntry: EmployerTimeEntry = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.fullName,
      weekStart: form.weekStart,
      regularHours: toNumber(form.regularHours),
      overtimeDayHours: toNumber(form.overtimeDayHours),
      overtimeNightHours: toNumber(form.overtimeNightHours),
      overtimeRestOrHolidayDayHours: toNumber(form.overtimeRestOrHolidayDayHours),
      overtimeRestOrHolidayNightHours: toNumber(form.overtimeRestOrHolidayNightHours),
      overtimeAmount: previewAmount,
      status: "draft",
      note: form.note.trim() || "A completer",
      createdAt: new Date().toISOString(),
    };

    const previousEntries = entries;
    setEntries((current) => [nextEntry, ...current]);
    setForm({ ...emptyForm, employeeId: employee.id, weekStart: form.weekStart });
    void persistTimeEntry(nextEntry, previousEntries, `Pointage ajoute pour ${employee.fullName}.`);
  }

  async function importPointageCsv(file: File | null) {
    if (!file) return;
    if (!activeCompany) {
      setMessage("Selectionnez une entreprise avant d importer le pointage.");
      return;
    }
    setMessage(null);
    const previousEntries = entries;
    try {
      const records = parseCsvRecords(await file.text());
      if (records.length === 0) {
        setMessage("CSV vide ou en-tetes introuvables.");
        return;
      }

      let imported = 0;
      let skipped = 0;
      const nextEntries = [...entries];

      for (const record of records) {
        const employeeRef = readCsvField(record, ["Matricule", "Matricule interne", "employeeNumber", "employeeId"]);
        const employeeName = readCsvField(record, ["Salarie", "Nom", "Nom complet", "employeeName"]);
        const employee = activeEmployees.find(
          (item) =>
            normalizeKey(item.id) === normalizeKey(employeeRef) ||
            normalizeKey(item.employeeNumber) === normalizeKey(employeeRef) ||
            normalizeKey(item.fullName) === normalizeKey(employeeName),
        );
        const weekStart = parseDateField(readCsvField(record, ["Semaine", "Semaine du", "weekStart", "date"]));
        if (!employee || !weekStart) {
          skipped += 1;
          continue;
        }

        const importedForm: TimeFormState = {
          employeeId: employee.id,
          weekStart,
          regularHours: String(parseCsvNumber(readCsvField(record, ["Heures normales", "Normales", "regularHours"])) || 0),
          overtimeDayHours: String(parseCsvNumber(readCsvField(record, ["Sup jour", "overtimeDayHours"])) || 0),
          overtimeNightHours: String(parseCsvNumber(readCsvField(record, ["Sup nuit", "overtimeNightHours"])) || 0),
          overtimeRestOrHolidayDayHours: String(parseCsvNumber(readCsvField(record, ["Repos ferie jour", "Repos/ferie jour", "overtimeRestOrHolidayDayHours"])) || 0),
          overtimeRestOrHolidayNightHours: String(parseCsvNumber(readCsvField(record, ["Repos ferie nuit", "Repos/ferie nuit", "overtimeRestOrHolidayNightHours"])) || 0),
          note: readCsvField(record, ["Note", "Commentaire", "note"]) || "Import CSV",
        };
        if (toNumber(importedForm.regularHours) <= 0 && overtimeHours(importedForm) <= 0) {
          skipped += 1;
          continue;
        }

        const existingIndex = nextEntries.findIndex((entry) => entry.employeeId === employee.id && entry.weekStart === weekStart);
        const existing = existingIndex >= 0 ? nextEntries[existingIndex] : null;
        const nextEntry: EmployerTimeEntry = {
          id: existing?.id ?? crypto.randomUUID(),
          employeeId: employee.id,
          employeeName: employee.fullName,
          weekStart,
          regularHours: toNumber(importedForm.regularHours),
          overtimeDayHours: toNumber(importedForm.overtimeDayHours),
          overtimeNightHours: toNumber(importedForm.overtimeNightHours),
          overtimeRestOrHolidayDayHours: toNumber(importedForm.overtimeRestOrHolidayDayHours),
          overtimeRestOrHolidayNightHours: toNumber(importedForm.overtimeRestOrHolidayNightHours),
          overtimeAmount: calculateOvertimeAmount(employee, importedForm),
          status: parseTimeEntryStatus(readCsvField(record, ["Statut", "status"])),
          note: importedForm.note,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          decidedAt: existing?.decidedAt,
        };

        if (existingIndex >= 0) {
          nextEntries[existingIndex] = nextEntry;
        } else {
          nextEntries.unshift(nextEntry);
        }
        imported += 1;
      }

      if (imported === 0) {
        setMessage(`Aucun pointage importe. ${skipped} ligne(s) ignoree(s).`);
        return;
      }

      setEntries(nextEntries);
      writeEmployerTimeEntries(nextEntries);
      const saved = await saveEmployerTimeEntriesToCloud(activeCompany.id, nextEntries);
      if (!saved?.ok || !Array.isArray(saved.items)) throw new Error("Sauvegarde cloud du pointage impossible.");
      setEntries(saved.items);
      writeEmployerTimeEntries(saved.items);
      setMessage(`${imported} pointage(s) importe(s). ${skipped} ligne(s) ignoree(s).`);
    } catch (error) {
      setEntries(previousEntries);
      writeEmployerTimeEntries(previousEntries);
      setMessage(error instanceof Error ? error.message : "Import pointage impossible.");
    }
  }

  function downloadPointageTemplate() {
    downloadCsv("modele-import-pointage.csv", [
      [
        "Matricule",
        "Salarie",
        "Semaine",
        "Heures normales",
        "Sup jour",
        "Sup nuit",
        "Repos ferie jour",
        "Repos ferie nuit",
        "Statut",
        "Note",
      ],
      ["SAL-001", "Sara El Mansouri", defaultWeekStart(), "44", "2", "0", "0", "0", "draft", "Import CSV"],
    ]);
  }

  function decideEntry(entryId: string, status: Exclude<EmployerTimeEntryStatus, "draft">) {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;
    const updatedEntry = { ...entry, status, decidedAt: new Date().toISOString() };
    const previousEntries = entries;
    setEntries((current) => replaceTimeEntryInList(current, updatedEntry));
    void persistTimeEntry(updatedEntry, previousEntries, status === "approved" ? "Heures approuvees." : "Pointage refuse.");
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="min-w-0 space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Pointage</p>
              <h2 className="mt-2 text-xl font-black">Saisie hebdomadaire</h2>
            </div>
            <Timer className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <form onSubmit={submitEntry} className="mt-5 space-y-4">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Semaine du</span>
                <input
                  type="date"
                  required
                  value={form.weekStart}
                  onChange={(event) => updateForm("weekStart", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Heures normales</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.regularHours}
                  onChange={(event) => updateForm("regularHours", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Sup jour</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.overtimeDayHours}
                  onChange={(event) => updateForm("overtimeDayHours", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Sup nuit</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.overtimeNightHours}
                  onChange={(event) => updateForm("overtimeNightHours", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Repos/ferie jour</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.overtimeRestOrHolidayDayHours}
                  onChange={(event) => updateForm("overtimeRestOrHolidayDayHours", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Repos/ferie nuit</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.overtimeRestOrHolidayNightHours}
                  onChange={(event) => updateForm("overtimeRestOrHolidayNightHours", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Note</span>
              <textarea
                value={form.note}
                onChange={(event) => updateForm("note", event.target.value)}
                className="input-shell mt-1 min-h-20 resize-y py-3"
                placeholder="Ex: cloture, inventaire, urgence client..."
              />
            </label>

            <div className="rounded-lg bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold text-[var(--ink-soft)]">Montant estime</p>
              <p className="mt-2 text-2xl font-black text-[var(--heading)]">{formatMoney(previewAmount)}</p>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
            >
              Ajouter au pointage
            </button>
            {message ? (
              <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
            ) : null}
          </form>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">A valider</p>
            <p className="mt-2 text-2xl font-black">{totals.pending}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Heures approuvees</p>
            <p className="mt-2 text-2xl font-black">{totals.approvedHours.toFixed(1)} h</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">A integrer paie</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(totals.approvedAmount)}</p>
          </div>
        </section>
      </aside>

      <section className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex min-w-0 flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Validation</p>
            <h2 className="mt-2 text-xl font-black">Pointages & majorations</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Les montants approuves servent de reference pour la prime d heures sup dans la paie.</p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:shrink-0">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input-shell h-10 w-full min-w-0 pl-9 sm:w-64"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Rechercher"
              />
            </label>
            <Link
              href="/employer/payroll"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
            >
              Ouvrir paie
            </Link>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  void importPointageCsv(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={downloadPointageTemplate}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
            >
              Modele
            </button>
          </div>
        </div>

        {message ? <p className="border-b border-[var(--line)] px-5 py-3 text-sm font-bold text-[var(--ok)]">{message}</p> : null}

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <tr>
                <th className="px-5 py-3">Salarie</th>
                <th className="px-5 py-3">Semaine</th>
                <th className="px-5 py-3">Normales</th>
                <th className="px-5 py-3">Sup jour</th>
                <th className="px-5 py-3">Sup nuit</th>
                <th className="px-5 py-3">Repos/ferie</th>
                <th className="px-5 py-3">Montant</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black text-[var(--heading)]">{entry.employeeName}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{entry.note}</p>
                  </td>
                  <td className="px-5 py-4">{entry.weekStart}</td>
                  <td className="px-5 py-4">{entry.regularHours} h</td>
                  <td className="px-5 py-4">{entry.overtimeDayHours} h</td>
                  <td className="px-5 py-4">{entry.overtimeNightHours} h</td>
                  <td className="px-5 py-4">
                    {entry.overtimeRestOrHolidayDayHours + entry.overtimeRestOrHolidayNightHours} h
                  </td>
                  <td className="px-5 py-4 font-bold">{formatMoney(entry.overtimeAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(entry.status)}`}>
                      {employerTimeEntryStatusLabels[entry.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {entry.status === "draft" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decideEntry(entry.id, "approved")}
                          className="inline-flex h-9 items-center rounded-lg bg-[var(--accent)] px-3 text-xs font-bold text-[var(--juris-on-primary)]"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => decideEntry(entry.id, "rejected")}
                          className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs font-bold hover:bg-[var(--surface-muted)]"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Refuser
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-sm text-[var(--ink-soft)]">
                        <Clock3 className="mr-1.5 h-4 w-4" />
                        {entry.decidedAt ? entry.decidedAt.slice(0, 10) : "Decision"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--ink-soft)]">Aucun pointage ne correspond a cette recherche.</div>
        ) : null}
      </section>
    </div>
  );
}
