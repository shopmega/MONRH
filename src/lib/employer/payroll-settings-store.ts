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
