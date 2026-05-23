import { EMPLOYER_LEAVE_REQUEST_STORAGE_KEY, type EmployerLeaveRequest } from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

export function parseEmployerLeaveRequests(value: string | null): EmployerLeaveRequest[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as EmployerLeaveRequest[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readEmployerLeaveRequests(): EmployerLeaveRequest[] | null {
  return parseEmployerLeaveRequests(readEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY));
}

export function writeEmployerLeaveRequests(requests: EmployerLeaveRequest[]) {
  writeEmployerScopedValue(EMPLOYER_LEAVE_REQUEST_STORAGE_KEY, JSON.stringify(requests));
}

export async function fetchEmployerLeaveRequestsFromCloud(companyId: string): Promise<EmployerLeaveRequest[] | null> {
  const response = await fetch(`/api/employer/leave-requests?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Conges cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerLeaveRequest[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerLeaveRequestsToCloud(companyId: string, requests: EmployerLeaveRequest[]) {
  const response = await fetch("/api/employer/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, items: requests }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud des conges impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerLeaveRequest[] };
}

export async function saveEmployerLeaveRequestToCloud(companyId: string, request: EmployerLeaveRequest) {
  const response = await fetch("/api/employer/leave-requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: request }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de la demande impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerLeaveRequest };
  return data.ok && data.item ? data.item : null;
}
