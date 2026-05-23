import {
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  employerDocumentChecklist,
  type EmployerEmployee,
  type EmployerEmployeeDocument,
} from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function normalizeEmployerEmployeeDocuments(documents?: EmployerEmployeeDocument[]) {
  return employerDocumentChecklist.map((document) => {
    const stored = documents?.find((item) => item.type === document.type);
    return {
      ...document,
      attached: stored?.attached ?? document.attached,
      updatedAt: stored?.updatedAt,
    };
  });
}

export function normalizeEmployerEmployee(employee: EmployerEmployee): EmployerEmployee {
  return {
    ...employee,
    employeeNumber: employee.employeeNumber?.trim() || employee.id,
    cin: employee.cin?.trim() || "",
    childrenCount: Math.max(0, Math.min(6, Math.trunc(employee.childrenCount ?? 0))),
    documents: normalizeEmployerEmployeeDocuments(employee.documents),
  };
}

export function parseEmployerEmployees(value: string | null): EmployerEmployee[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as EmployerEmployee[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeEmployerEmployee);
  } catch {
    return null;
  }
}

export function readEmployerEmployees(): EmployerEmployee[] | null {
  return parseEmployerEmployees(readEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY));
}

export function writeEmployerEmployees(employees: EmployerEmployee[]) {
  writeEmployerScopedValue(EMPLOYER_EMPLOYEE_STORAGE_KEY, JSON.stringify(employees.map(normalizeEmployerEmployee)));
}

export async function fetchEmployerEmployeesFromCloud(companyId: string): Promise<EmployerEmployee[] | null> {
  const response = await fetch(`/api/employer/employees?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Registre cloud indisponible.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerEmployee[] };
  return data.ok && Array.isArray(data.items) ? data.items.map(normalizeEmployerEmployee) : null;
}

export async function saveEmployerEmployeesToCloud(companyId: string, employees: EmployerEmployee[]) {
  const response = await fetch("/api/employer/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: employees.map(normalizeEmployerEmployee) }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud du registre impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerEmployee[] };
}

export async function saveEmployerEmployeeToCloud(companyId: string, employee: EmployerEmployee) {
  const response = await fetch("/api/employer/employees", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: normalizeEmployerEmployee(employee) }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud du salarie impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerEmployee };
  return data.ok && data.item ? normalizeEmployerEmployee(data.item) : null;
}
