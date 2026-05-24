import {
  defaultEmployerPayrollSettings,
  EMPLOYER_PAYROLL_SETTINGS_STORAGE_KEY,
  type EmployerPayrollSettings,
} from "@/lib/employer/portal-data";
import { readEmployerScopedValue, writeEmployerScopedValue } from "@/lib/employer/company-store";

function normalizeSettings(value: Partial<EmployerPayrollSettings> | null): EmployerPayrollSettings {
  return {
    ...defaultEmployerPayrollSettings,
    ...(value ?? {}),
    accountingAccounts: {
      ...defaultEmployerPayrollSettings.accountingAccounts,
      ...(value?.accountingAccounts ?? {}),
    },
    rubrics: Array.isArray(value?.rubrics) && value.rubrics.length > 0
      ? value.rubrics
      : defaultEmployerPayrollSettings.rubrics,
  };
}

export function readEmployerPayrollSettings(): EmployerPayrollSettings {
  const stored = readEmployerScopedValue(EMPLOYER_PAYROLL_SETTINGS_STORAGE_KEY);
  if (!stored) return defaultEmployerPayrollSettings;
  try {
    return normalizeSettings(JSON.parse(stored) as Partial<EmployerPayrollSettings>);
  } catch {
    return defaultEmployerPayrollSettings;
  }
}

export function writeEmployerPayrollSettings(settings: EmployerPayrollSettings) {
  writeEmployerScopedValue(EMPLOYER_PAYROLL_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
}

export async function fetchEmployerPayrollSettingsFromCloud(companyId: string): Promise<EmployerPayrollSettings | null> {
  const response = await fetch(`/api/employer/payroll-settings?companyId=${encodeURIComponent(companyId)}`, {
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Parametres de paie cloud indisponibles.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerPayrollSettings };
  return data.ok && data.item ? normalizeSettings(data.item) : null;
}

export async function saveEmployerPayrollSettingsToCloud(companyId: string, settings: EmployerPayrollSettings) {
  const response = await fetch("/api/employer/payroll-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, item: normalizeSettings(settings) }),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Sauvegarde cloud des parametres de paie impossible.");
  const data = (await response.json()) as { ok: boolean; item?: EmployerPayrollSettings };
  return data.ok && data.item ? normalizeSettings(data.item) : null;
}
