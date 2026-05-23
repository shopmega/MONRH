import { EMPLOYER_PAYROLL_RUN_STORAGE_KEY, type EmployerPayrollRun } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerPayrollRuns(value: string | null): EmployerPayrollRun[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as EmployerPayrollRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readEmployerPayrollRuns(): EmployerPayrollRun[] {
  return parseEmployerPayrollRuns(readEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY));
}

export function writeEmployerPayrollRuns(runs: EmployerPayrollRun[]) {
  writeEmployerScopedValue(EMPLOYER_PAYROLL_RUN_STORAGE_KEY, JSON.stringify(runs));
}

export async function fetchEmployerPayrollRunsFromCloud(companyId: string): Promise<EmployerPayrollRun[] | null> {
  const response = await fetch(`/api/employer/payroll-runs?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Historique paie cloud indisponible.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerPayrollRun[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerPayrollRunsToCloud(companyId: string, runs: EmployerPayrollRun[]) {
  const response = await fetch("/api/employer/payroll-runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: runs }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de la paie impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerPayrollRun[] };
}

export async function saveEmployerPayrollRunToCloud(companyId: string, run: EmployerPayrollRun) {
  const response = await fetch("/api/employer/payroll-runs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: run }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de la paie impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerPayrollRun };
  return data.ok && data.item ? data.item : null;
}
