"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY,
  type EmployerCompany,
  type EmployerEmployee,
  type EmployerEmployeeDocument,
  type EmployerEmployeeDocumentType,
} from "@/lib/employer/portal-data";
import {
  getActiveEmployerCompany,
  readEmployerCompanies,
  writeEmployerScopedValue,
} from "@/lib/employer/company-store";
import {
  fetchEmployerEmployeesFromCloud,
  normalizeEmployerEmployee,
  normalizeEmployerEmployeeDocuments,
  readEmployerEmployees,
  saveEmployerEmployeeToCloud,
  writeEmployerEmployees,
} from "@/lib/employer/employee-store";
import type { ContractFormData } from "@/lib/contracts/types";

type EmployeeFormState = {
  employeeNumber: string;
  fullName: string;
  cin: string;
  role: string;
  contractType: EmployerEmployee["contractType"];
  startDate: string;
  endDate: string;
  grossSalary: string;
  cnssNumber: string;
  childrenCount: string;
  email: string;
};

const emptyForm: EmployeeFormState = {
  employeeNumber: "",
  fullName: "",
  cin: "",
  role: "",
  contractType: "CDI",
  startDate: "",
  endDate: "",
  grossSalary: "",
  cnssNumber: "",
  childrenCount: "0",
  email: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSeniority(startDate: string) {
  const started = new Date(startDate);
  if (Number.isNaN(started.getTime())) return "A verifier";
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mois`;
  return `${years} an${years > 1 ? "s" : ""} ${remainingMonths} mois`;
}

function normalizeDocuments(documents?: EmployerEmployeeDocument[]) {
  return normalizeEmployerEmployeeDocuments(documents);
}

function normalizeEmployee(employee: EmployerEmployee): EmployerEmployee {
  return normalizeEmployerEmployee(employee);
}

function getDocumentProgress(employee: EmployerEmployee) {
  const documents = normalizeDocuments(employee.documents);
  const completed = documents.filter((document) => document.attached).length;
  return {
    completed,
    total: documents.length,
  };
}

function buildRegisterCsv(employees: EmployerEmployee[]) {
  const header = [
    "Nom",
    "Matricule interne",
    "CIN",
    "Poste",
    "Contrat",
    "Date debut",
    "Date fin",
    "Salaire brut",
    "CNSS",
    "Enfants",
    "Email",
    "Statut",
    "Documents joints",
  ];
  const rows = employees.map((employee) => {
    const progress = getDocumentProgress(employee);
    return [
      employee.fullName,
      employee.employeeNumber ?? employee.id,
      employee.cin ?? "",
      employee.role,
      employee.contractType,
      employee.startDate,
      employee.endDate ?? "",
      String(employee.grossSalary),
      employee.cnssNumber,
      String(employee.childrenCount ?? 0),
      employee.email ?? "",
      employee.status,
      `${progress.completed}/${progress.total}`,
    ];
  });
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function getContractDurationMonths(startDate: string, endDate?: string) {
  if (!endDate) return undefined;
  const started = new Date(startDate);
  const ended = new Date(endDate);
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) return undefined;
  const months = Math.max(1, (ended.getFullYear() - started.getFullYear()) * 12 + ended.getMonth() - started.getMonth());
  return months;
}

function mapContractType(contractType: EmployerEmployee["contractType"]): ContractFormData["contract_type"] {
  return contractType === "CDI" ? "CDI" : "CDD";
}

function buildContractDraft(employee: EmployerEmployee, company: EmployerCompany): ContractFormData {
  const contractType = mapContractType(employee.contractType);
  return {
    employee_name: employee.fullName,
    employee_address: "",
    employee_cin: employee.cin ?? "",
    employee_cnss: employee.cnssNumber === "A completer" ? "" : employee.cnssNumber,
    company_name: company.name,
    company_address: company.city,
    company_rc: company.ice,
    company_cnss: company.cnssAffiliateNumber,
    job_title: employee.role,
    job_description: employee.role,
    role_level: employee.grossSalary >= 10000 ? "cadre" : "employee",
    contract_type: contractType,
    start_date: employee.startDate,
    end_date: employee.endDate,
    contract_duration: getContractDurationMonths(employee.startDate, employee.endDate),
    cdd_justification: contractType === "CDD" ? `A completer: motif legal du recours au ${employee.contractType}.` : undefined,
    trial_period_duration: contractType === "CDI" ? "3 mois" : "1 mois",
    salary_brut: employee.grossSalary,
    payment_frequency: "mensuel",
    payment_method: "virement",
    work_hours: "44",
    work_days: "6",
    work_schedule: "Selon planning communique par l'employeur",
    annual_leave_days: "18",
    selected_clauses: [],
    clause_variables: {},
    notice_period_employee: "15",
    contract_location: company.city || "Casablanca",
    contract_date: new Date().toISOString().slice(0, 10),
  };
}

function replaceEmployeeInList(employees: EmployerEmployee[], employee: EmployerEmployee) {
  return employees.some((item) => item.id === employee.id)
    ? employees.map((item) => (item.id === employee.id ? employee : item))
    : [employee, ...employees];
}

export function EmployeeRegisterClient() {
  const [employees, setEmployees] = useState<EmployerEmployee[]>([]);
  const [activeCompany, setActiveCompany] = useState<EmployerCompany | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = readEmployerEmployees();
    const nextEmployees = stored ?? [];
    const nextCompanies = readEmployerCompanies();
    const nextActiveCompany = getActiveEmployerCompany(nextCompanies);
    setEmployees(nextEmployees);
    setActiveCompany(nextActiveCompany);
    setSelectedEmployeeId((current) => current || nextEmployees[0]?.id || "");
    if (!nextActiveCompany) return;

    let cancelled = false;
    fetchEmployerEmployeesFromCloud(nextActiveCompany.id)
      .then((cloudEmployees) => {
        if (cancelled || cloudEmployees === null) return;
        setEmployees(cloudEmployees);
        writeEmployerEmployees(cloudEmployees);
        setSelectedEmployeeId((current) => current || cloudEmployees[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setMessage("Registre cloud indisponible, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return employees;
    return employees.filter((employee) =>
      [employee.fullName, employee.role, employee.contractType, employee.cnssNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [employees, query]);

  const totals = useMemo(() => {
    const totalDocuments = employees.reduce((sum, employee) => sum + getDocumentProgress(employee).total, 0);
    const completedDocuments = employees.reduce((sum, employee) => sum + getDocumentProgress(employee).completed, 0);
    return {
      count: employees.length,
      payroll: employees.reduce((sum, employee) => sum + employee.grossSalary, 0),
      activeContracts: employees.filter((employee) => employee.status === "Actif").length,
      completedDocuments,
      totalDocuments,
    };
  }, [employees]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? employees[0] ?? null,
    [employees, selectedEmployeeId],
  );

  if (!activeCompany) return null;
  const company = activeCompany;

  async function persistEmployee(employee: EmployerEmployee, previousEmployees: EmployerEmployee[], successMessage?: string) {
    try {
      const savedEmployee = await saveEmployerEmployeeToCloud(company.id, employee);
      if (!savedEmployee) throw new Error("unauthorized");
      setEmployees((current) => {
        const nextEmployees = replaceEmployeeInList(current, savedEmployee);
        writeEmployerEmployees(nextEmployees);
        return nextEmployees;
      });
      if (successMessage) setMessage(successMessage);
    } catch {
      setEmployees(previousEmployees);
      setMessage("Modification non sauvegardee. Verifiez la connexion et reessayez.");
    }
  }

  function updateForm<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const grossSalary = Number(form.grossSalary);
    if (!form.fullName.trim() || !form.role.trim() || !form.startDate || !Number.isFinite(grossSalary) || grossSalary <= 0) {
      return;
    }

    const nextEmployee: EmployerEmployee = {
      id: crypto.randomUUID(),
      employeeNumber: form.employeeNumber.trim() || undefined,
      fullName: form.fullName.trim(),
      cin: form.cin.trim() || undefined,
      role: form.role.trim(),
      contractType: form.contractType,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      grossSalary,
      cnssNumber: form.cnssNumber.trim() || "A completer",
      childrenCount: Math.max(0, Math.min(6, Math.trunc(Number(form.childrenCount) || 0))),
      email: form.email.trim() || undefined,
      documents: normalizeDocuments(),
      status: "Actif",
    };

    const normalizedEmployee = normalizeEmployee(nextEmployee);
    const previousEmployees = employees;
    setEmployees((current) => [normalizedEmployee, ...current]);
    setSelectedEmployeeId(nextEmployee.id);
    setForm(emptyForm);
    void persistEmployee(normalizedEmployee, previousEmployees, `${nextEmployee.fullName} ajoute au registre.`);
  }

  function updateEmployee(employeeId: string, patch: Partial<EmployerEmployee>) {
    const currentEmployee = employees.find((employee) => employee.id === employeeId);
    if (!currentEmployee) return;
    const updatedEmployee = normalizeEmployee({ ...currentEmployee, ...patch });
    const previousEmployees = employees;
    setEmployees((current) => replaceEmployeeInList(current, updatedEmployee));
    void persistEmployee(updatedEmployee, previousEmployees);
  }

  function toggleDocument(employeeId: string, type: EmployerEmployeeDocumentType) {
    const today = new Date().toISOString().slice(0, 10);
    const currentEmployee = employees.find((employee) => employee.id === employeeId);
    if (!currentEmployee) return;
    const documents = normalizeDocuments(currentEmployee.documents).map((document) =>
      document.type === type ? { ...document, attached: !document.attached, updatedAt: today } : document,
    );
    const updatedEmployee = normalizeEmployee({ ...currentEmployee, documents });
    const previousEmployees = employees;
    setEmployees((current) => replaceEmployeeInList(current, updatedEmployee));
    void persistEmployee(updatedEmployee, previousEmployees, "Dossier salarie mis a jour.");
  }

  function exportCsv() {
    const csv = buildRegisterCsv(employees);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "registre-personnel.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Export CSV du registre genere.");
  }

  function prepareContractDraft(employee: EmployerEmployee) {
    const draft = {
      formData: buildContractDraft(employee, company),
      currentStep: 0,
      touchedFields: [
        "contract_type",
        "company_name",
        "company_cnss",
        "employee_name",
        "employee_cnss",
        "job_title",
        "start_date",
        "salary_brut",
      ],
      timestamp: new Date().toISOString(),
      source: "employer_register",
      employeeId: employee.id,
    };

    writeEmployerScopedValue(EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setMessage(`Brouillon contrat prepare pour ${employee.fullName}.`);
    window.location.href = "/contrat";
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Registre</p>
              <h2 className="mt-2 text-xl font-black">Ajouter un salarie</h2>
            </div>
            <Users className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <form onSubmit={addEmployee} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Nom complet</span>
              <input
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.target.value)}
                className="input-shell mt-1"
                placeholder="Ex: Sara El Mansouri"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Matricule interne</span>
                <input
                  value={form.employeeNumber}
                  onChange={(event) => updateForm("employeeNumber", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="SAL-001"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">CIN</span>
                <input
                  value={form.cin}
                  onChange={(event) => updateForm("cin", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="BK123456"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Email professionnel</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="input-shell mt-1"
                placeholder="nom@entreprise.ma"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Poste</span>
              <input
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
                className="input-shell mt-1"
                placeholder="Ex: Responsable paie"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Contrat</span>
                <select
                  value={form.contractType}
                  onChange={(event) => updateForm("contractType", event.target.value as EmployerEmployee["contractType"])}
                  className="input-shell mt-1"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Interim">Interim</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Date debut</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateForm("startDate", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Date fin contrat</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateForm("endDate", event.target.value)}
                className="input-shell mt-1"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Salaire brut mensuel</span>
                <input
                  type="number"
                  min="0"
                  value={form.grossSalary}
                  onChange={(event) => updateForm("grossSalary", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="6500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Numero CNSS</span>
                <input
                  value={form.cnssNumber}
                  onChange={(event) => updateForm("cnssNumber", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="Optionnel"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Enfants</span>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={form.childrenCount}
                  onChange={(event) => updateForm("childrenCount", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter au registre
            </button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Salaries</p>
            <p className="mt-2 text-2xl font-black">{totals.count}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Contrats actifs</p>
            <p className="mt-2 text-2xl font-black">{totals.activeContracts}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Masse salariale brute</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(totals.payroll)}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold text-[var(--ink-soft)]">Documents RH</p>
            <p className="mt-2 text-2xl font-black">
              {totals.completedDocuments}/{totals.totalDocuments}
            </p>
          </div>
        </div>
      </aside>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Personnel</p>
            <h2 className="mt-2 text-xl font-black">Registre entreprise</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input-shell h-10 min-w-64 pl-9"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Rechercher un salarie"
              />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </button>
          </div>
          {message ? <p className="text-sm font-bold text-[var(--ok)]">{message}</p> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <tr>
                <th className="px-5 py-3">Salarie</th>
                <th className="px-5 py-3">Contrat</th>
                <th className="px-5 py-3">Anciennete</th>
                <th className="px-5 py-3">Salaire brut</th>
                <th className="px-5 py-3">CNSS</th>
                <th className="px-5 py-3">Dossier</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredEmployees.map((employee) => {
                const documentProgress = getDocumentProgress(employee);
                return (
                <tr
                  key={employee.id}
                  className={`cursor-pointer align-top transition hover:bg-[var(--surface-muted)] ${
                    selectedEmployee?.id === employee.id ? "bg-[var(--accent-soft)]" : ""
                  }`}
                  onClick={() => setSelectedEmployeeId(employee.id)}
                >
                  <td className="px-5 py-4">
                    <p className="font-black text-[var(--heading)]">{employee.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{employee.role}</p>
                    {employee.email ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{employee.email}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                      {employee.contractType}
                    </span>
                    {employee.endDate ? <p className="mt-2 text-xs text-[var(--ink-soft)]">Fin {employee.endDate}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                      <CalendarDays className="h-4 w-4" />
                      {getSeniority(employee.startDate)}
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Depuis {employee.startDate}</p>
                  </td>
                  <td className="px-5 py-4 font-bold">{formatMoney(employee.grossSalary)}</td>
                  <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">{employee.cnssNumber}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                      {documentProgress.completed}/{documentProgress.total}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[var(--ok-bg)] px-2.5 py-1 text-xs font-bold text-[var(--ok)]">
                      {employee.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--ink-soft)]">Aucun salarie ne correspond a cette recherche.</div>
        )}

        {selectedEmployee ? (
          <div className="border-t border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  Fiche salarie
                </p>
                <h3 className="mt-2 text-2xl font-black text-[var(--heading)]">{selectedEmployee.fullName}</h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{selectedEmployee.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeId("")}
                className="inline-flex h-10 w-fit items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]"
              >
                <X className="mr-2 h-4 w-4" />
                Fermer
              </button>
              <button
                type="button"
                onClick={() => prepareContractDraft(selectedEmployee)}
                className="inline-flex h-10 w-fit items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-bold text-[var(--juris-on-primary)] hover:bg-[var(--accent-dark)]"
              >
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Preparer contrat
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[var(--accent)]" />
                  <h4 className="font-black">Contrat & paie</h4>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Matricule interne</span>
                    <input
                      value={selectedEmployee.employeeNumber ?? selectedEmployee.id}
                      onChange={(event) => updateEmployee(selectedEmployee.id, { employeeNumber: event.target.value })}
                      className="input-shell mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">CIN</span>
                    <input
                      value={selectedEmployee.cin ?? ""}
                      onChange={(event) => updateEmployee(selectedEmployee.id, { cin: event.target.value })}
                      className="input-shell mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Statut</span>
                    <select
                      value={selectedEmployee.status}
                      onChange={(event) =>
                        updateEmployee(selectedEmployee.id, {
                          status: event.target.value as EmployerEmployee["status"],
                        })
                      }
                      className="input-shell mt-1"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Suspendu">Suspendu</option>
                      <option value="Sorti">Sorti</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Salaire brut</span>
                    <input
                      type="number"
                      min="0"
                      value={selectedEmployee.grossSalary}
                      onChange={(event) =>
                        updateEmployee(selectedEmployee.id, {
                          grossSalary: Number(event.target.value) || 0,
                        })
                      }
                      className="input-shell mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Date fin</span>
                    <input
                      type="date"
                      value={selectedEmployee.endDate ?? ""}
                      onChange={(event) =>
                        updateEmployee(selectedEmployee.id, {
                          endDate: event.target.value || undefined,
                        })
                      }
                      className="input-shell mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Numero CNSS</span>
                    <input
                      value={selectedEmployee.cnssNumber}
                      onChange={(event) => updateEmployee(selectedEmployee.id, { cnssNumber: event.target.value })}
                      className="input-shell mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-[var(--ink-soft)]">Enfants</span>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={selectedEmployee.childrenCount ?? 0}
                      onChange={(event) =>
                        updateEmployee(selectedEmployee.id, {
                          childrenCount: Math.max(0, Math.min(6, Math.trunc(Number(event.target.value) || 0))),
                        })
                      }
                      className="input-shell mt-1"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--accent)]" />
                    <h4 className="font-black">Documents attaches</h4>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold">
                    {getDocumentProgress(selectedEmployee).completed}/{getDocumentProgress(selectedEmployee).total}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {normalizeDocuments(selectedEmployee.documents).map((document) => (
                    <button
                      key={document.type}
                      type="button"
                      onClick={() => toggleDocument(selectedEmployee.id, document.type)}
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                        document.attached
                          ? "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <span>{document.label}</span>
                      {document.attached ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
