import { EMPLOYER_CNSS_EXPORT_STORAGE_KEY, type EmployerCnssExport } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerCnssExports(value: string | null): EmployerCnssExport[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as EmployerCnssExport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readEmployerCnssExports(): EmployerCnssExport[] {
  return parseEmployerCnssExports(readEmployerScopedValue(EMPLOYER_CNSS_EXPORT_STORAGE_KEY));
}

export function writeEmployerCnssExports(exports: EmployerCnssExport[]) {
  writeEmployerScopedValue(EMPLOYER_CNSS_EXPORT_STORAGE_KEY, JSON.stringify(exports));
}

export async function fetchEmployerCnssExportsFromCloud(companyId: string): Promise<EmployerCnssExport[] | null> {
  const response = await fetch(`/api/employer/cnss-exports?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Exports CNSS cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerCnssExport[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerCnssExportsToCloud(companyId: string, exports: EmployerCnssExport[]) {
  const response = await fetch("/api/employer/cnss-exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: exports }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud des exports CNSS impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerCnssExport[] };
}

export async function saveEmployerCnssExportToCloud(companyId: string, cnssExport: EmployerCnssExport) {
  const response = await fetch("/api/employer/cnss-exports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: cnssExport }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de l'export CNSS impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerCnssExport };
  return data.ok && data.item ? data.item : null;
}
