import { EMPLOYER_TIME_ENTRY_STORAGE_KEY, type EmployerTimeEntry } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerTimeEntries(value: string | null): EmployerTimeEntry[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as EmployerTimeEntry[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readEmployerTimeEntries(): EmployerTimeEntry[] | null {
  return parseEmployerTimeEntries(readEmployerScopedValue(EMPLOYER_TIME_ENTRY_STORAGE_KEY));
}

export function writeEmployerTimeEntries(entries: EmployerTimeEntry[]) {
  writeEmployerScopedValue(EMPLOYER_TIME_ENTRY_STORAGE_KEY, JSON.stringify(entries));
}

export async function fetchEmployerTimeEntriesFromCloud(companyId: string): Promise<EmployerTimeEntry[] | null> {
  const response = await fetch(`/api/employer/time-entries?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Pointage cloud indisponible.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerTimeEntry[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerTimeEntriesToCloud(companyId: string, entries: EmployerTimeEntry[]) {
  const response = await fetch("/api/employer/time-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: entries }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud du pointage impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerTimeEntry[] };
}

export async function saveEmployerTimeEntryToCloud(companyId: string, entry: EmployerTimeEntry) {
  const response = await fetch("/api/employer/time-entries", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: entry }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud du pointage impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerTimeEntry };
  return data.ok && data.item ? data.item : null;
}
