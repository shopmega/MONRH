import {
  EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY,
  EMPLOYER_COMPANY_STORAGE_KEY,
  employerPlanCapabilities,
  type EmployerCompany,
} from "@/lib/employer/portal-data";

export function readEmployerCompanies(): EmployerCompany[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(EMPLOYER_COMPANY_STORAGE_KEY);
    if (stored === null) return [];
    const parsed = JSON.parse(stored) as EmployerCompany[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeEmployerCompanies(companies: EmployerCompany[]) {
  window.localStorage.setItem(EMPLOYER_COMPANY_STORAGE_KEY, JSON.stringify(companies));
  window.dispatchEvent(new CustomEvent("monrh-employer-companies-changed"));
}

export async function fetchEmployerCompaniesFromCloud(): Promise<EmployerCompany[] | null> {
  const response = await fetch("/api/employer/companies", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Entreprises cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; items?: EmployerCompany[] };
  return data.ok && Array.isArray(data.items) ? data.items : null;
}

export async function saveEmployerCompaniesToCloud(companies: EmployerCompany[]) {
  const response = await fetch("/api/employer/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: companies }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud des entreprises impossible.");
  return (await response.json()) as { ok: boolean; items?: EmployerCompany[] };
}

export async function saveEmployerCompanyToCloud(company: EmployerCompany) {
  const response = await fetch("/api/employer/companies", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item: company }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud de l'entreprise impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerCompany };
  return data.ok && data.item ? data.item : null;
}

export function readActiveEmployerCompanyId(companies: EmployerCompany[]) {
  if (typeof window === "undefined") return companies[0]?.id ?? "";
  const stored = window.localStorage.getItem(EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY);
  if (stored && companies.some((company) => company.id === stored)) return stored;
  return companies[0]?.id ?? "";
}

export function writeActiveEmployerCompanyId(companyId: string) {
  window.localStorage.setItem(EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY, companyId);
  window.dispatchEvent(new CustomEvent("monrh-employer-company-changed", { detail: { companyId } }));
}

export function getActiveEmployerCompany(companies: EmployerCompany[]) {
  const activeCompanyId = readActiveEmployerCompanyId(companies);
  return companies.find((company) => company.id === activeCompanyId) ?? companies[0] ?? null;
}

export function canAddEmployerCompany(companies: EmployerCompany[], activeCompany: EmployerCompany) {
  return companies.length < employerPlanCapabilities[activeCompany.plan].maxCompanies;
}

export function getEmployerScopedStorageKey(baseKey: string, companyId?: string) {
  const resolvedCompanyId = companyId ?? getActiveEmployerCompany(readEmployerCompanies())?.id;
  return resolvedCompanyId ? `${baseKey}:${resolvedCompanyId}` : baseKey;
}

export function readEmployerScopedValue(baseKey: string, companyId?: string) {
  if (typeof window === "undefined") return null;
  const scopedValue = window.localStorage.getItem(getEmployerScopedStorageKey(baseKey, companyId));
  return scopedValue ?? window.localStorage.getItem(baseKey);
}

export function writeEmployerScopedValue(baseKey: string, value: string, companyId?: string) {
  window.localStorage.setItem(getEmployerScopedStorageKey(baseKey, companyId), value);
}

export function removeEmployerScopedValue(baseKey: string, companyId?: string) {
  window.localStorage.removeItem(getEmployerScopedStorageKey(baseKey, companyId));
}
