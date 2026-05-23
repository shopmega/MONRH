import { EMPLOYER_CONTRACT_RECORD_STORAGE_KEY, type EmployerContractRecord } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerContractRecords(value: string | null): EmployerContractRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as EmployerContractRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readEmployerContractRecords(): EmployerContractRecord[] {
  return parseEmployerContractRecords(readEmployerScopedValue(EMPLOYER_CONTRACT_RECORD_STORAGE_KEY));
}

export function writeEmployerContractRecords(records: EmployerContractRecord[]) {
  writeEmployerScopedValue(EMPLOYER_CONTRACT_RECORD_STORAGE_KEY, JSON.stringify(records));
}

export async function fetchEmployerContractRecordsFromCloud(companyId: string): Promise<EmployerContractRecord[] | null> {
  const response = await fetch(`/api/employer/contract-records?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Contrats cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerContractRecord[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerContractRecordsToCloud(companyId: string, records: EmployerContractRecord[]) {
  const response = await fetch("/api/employer/contract-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: records }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud des contrats impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerContractRecord[] };
}

export async function saveEmployerContractRecordToCloud(companyId: string, record: EmployerContractRecord) {
  const response = await fetch("/api/employer/contract-records", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: record }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud du contrat impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerContractRecord };
  return data.ok && data.item ? data.item : null;
}
