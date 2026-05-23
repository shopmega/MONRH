import { EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY, type EmployerComplianceDismissal } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerComplianceDismissals(value: string | null): EmployerComplianceDismissal[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return { alertId: item, reason: "Traite", dismissedAt: new Date(0).toISOString() };
        }
        if (!item || typeof item !== "object") return null;
        const dismissal = item as Partial<EmployerComplianceDismissal>;
        if (!dismissal.alertId) return null;
        return {
          alertId: dismissal.alertId,
          reason: dismissal.reason?.trim() || "Traite",
          dismissedAt: dismissal.dismissedAt ?? new Date(0).toISOString(),
        };
      })
      .filter((item): item is EmployerComplianceDismissal => item !== null);
  } catch {
    return [];
  }
}

export function readEmployerComplianceDismissals(): EmployerComplianceDismissal[] {
  return parseEmployerComplianceDismissals(readEmployerScopedValue(EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY));
}

export function writeEmployerComplianceDismissals(dismissals: EmployerComplianceDismissal[]) {
  writeEmployerScopedValue(EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY, JSON.stringify(dismissals));
}

export async function fetchEmployerComplianceDismissalsFromCloud(
  companyId: string,
): Promise<EmployerComplianceDismissal[] | null> {
  const response = await fetch(`/api/employer/compliance-dismissals?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Alertes traitees cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerComplianceDismissal[] };
  return data.items ?? [];
}

export async function saveEmployerComplianceDismissalToCloud(
  companyId: string,
  dismissal: EmployerComplianceDismissal,
): Promise<EmployerComplianceDismissal | null> {
  const response = await fetch("/api/employer/compliance-dismissals", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: dismissal }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de l'alerte traitee impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerComplianceDismissal };
  return data.item ?? dismissal;
}

export async function clearEmployerComplianceDismissalsInCloud(companyId: string): Promise<boolean | null> {
  const response = await fetch(`/api/employer/compliance-dismissals?companyId=${encodeURIComponent(companyId)}`, {
    method: "DELETE",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Reinitialisation cloud des alertes traitees impossible.");
  return true;
}
