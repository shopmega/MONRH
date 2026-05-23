import {
  EMPLOYEE_ACTIVE_PROFILE_STORAGE_KEY,
  EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY,
  EMPLOYER_COMPANY_STORAGE_KEY,
  EMPLOYER_CNSS_EXPORT_STORAGE_KEY,
  EMPLOYER_CONTRACT_RECORD_STORAGE_KEY,
  EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY,
  EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY,
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
} from "@/lib/employer/portal-data";

export type EmployerWorkspaceSnapshot = {
  version: 1;
  savedAt: string;
  storage: Record<string, string>;
};

const EMPLOYER_STORAGE_PREFIXES = [
  "monrh_employer_",
  `${EMPLOYER_EMPLOYEE_STORAGE_KEY}:`,
  `${EMPLOYER_PAYROLL_RUN_STORAGE_KEY}:`,
  `${EMPLOYER_LEAVE_REQUEST_STORAGE_KEY}:`,
  `${EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY}:`,
  `${EMPLOYER_TIME_ENTRY_STORAGE_KEY}:`,
  `${EMPLOYER_CNSS_EXPORT_STORAGE_KEY}:`,
  `${EMPLOYER_CONTRACT_RECORD_STORAGE_KEY}:`,
  `${EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY}:`,
];

const EMPLOYER_STORAGE_KEYS = new Set([
  EMPLOYEE_ACTIVE_PROFILE_STORAGE_KEY,
  EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY,
  EMPLOYER_COMPANY_STORAGE_KEY,
  EMPLOYER_CNSS_EXPORT_STORAGE_KEY,
  EMPLOYER_CONTRACT_RECORD_STORAGE_KEY,
  EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY,
  EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY,
  EMPLOYER_EMPLOYEE_STORAGE_KEY,
  EMPLOYER_LEAVE_REQUEST_STORAGE_KEY,
  EMPLOYER_PAYROLL_RUN_STORAGE_KEY,
  EMPLOYER_TIME_ENTRY_STORAGE_KEY,
]);

function isEmployerStorageKey(key: string) {
  return EMPLOYER_STORAGE_KEYS.has(key) || EMPLOYER_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function collectEmployerWorkspaceSnapshot(): EmployerWorkspaceSnapshot {
  const storage: Record<string, string> = {};

  if (typeof window !== "undefined") {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !isEmployerStorageKey(key)) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    }
  }

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    storage,
  };
}

export function applyEmployerWorkspaceSnapshot(snapshot: EmployerWorkspaceSnapshot) {
  if (typeof window === "undefined") return;

  Object.entries(snapshot.storage).forEach(([key, value]) => {
    if (isEmployerStorageKey(key)) {
      window.localStorage.setItem(key, value);
    }
  });
}
