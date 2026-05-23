export type AudienceMode = "employee" | "employer" | "unknown";

export const AUDIENCE_MODE_STORAGE_KEY = "monrh_audience_mode";
export const AUDIENCE_QUERY_KEY = "audience";

const EMPLOYEE_SENSITIVE_CALCULATORS = new Set([
  "demission",
  "duree_preavis",
  "final_settlement_audit",
  "harassment_scenario",
  "licenciement",
  "licenciement_enhanced",
  "pre_litigation_timeline",
  "probation_termination",
  "unpaid_overtime_recovery",
  "unpaid_salary_recovery",
]);

const EMPLOYER_RESULT_CALCULATORS = new Set([
  "employer_total_cost",
  "hiring_cost",
  "leave_accrual",
  "net_gross",
  "net_gross_enhanced",
  "overtime",
  "payroll_mass",
  "payslip",
]);

export function parseAudienceMode(value?: string | null): AudienceMode | null {
  if (value === "employee" || value === "employer") {
    return value;
  }

  return null;
}

export function isEmployerRoute(pathname: string) {
  return pathname === "/employer" || pathname.startsWith("/employer/");
}

export function resolveAudienceMode({
  pathname,
  queryMode,
  storedMode,
}: {
  pathname: string;
  queryMode?: string | null;
  storedMode?: string | null;
}): AudienceMode {
  if (isEmployerRoute(pathname)) {
    return "employer";
  }

  return parseAudienceMode(queryMode) ?? parseAudienceMode(storedMode) ?? "unknown";
}

export function isEmployeeSensitiveCalculator(calculatorType?: string | null) {
  return calculatorType ? EMPLOYEE_SENSITIVE_CALCULATORS.has(calculatorType) : false;
}

export function canShowEmployerResultCta({
  audienceMode,
  calculatorType,
  pathname,
}: {
  audienceMode: AudienceMode;
  calculatorType?: string | null;
  pathname: string;
}) {
  if (audienceMode !== "employer" || isEmployeeSensitiveCalculator(calculatorType)) {
    return false;
  }

  if (isEmployerRoute(pathname)) {
    return true;
  }

  return calculatorType ? EMPLOYER_RESULT_CALCULATORS.has(calculatorType) : false;
}

export function withAudienceQuery(href: string, audienceMode: AudienceMode) {
  if (audienceMode !== "employee" && audienceMode !== "employer") {
    return href;
  }

  const [path, hash = ""] = href.split("#", 2);
  const separator = path.includes("?") ? "&" : "?";
  const nextHref = `${path}${separator}${AUDIENCE_QUERY_KEY}=${audienceMode}`;
  return hash ? `${nextHref}#${hash}` : nextHref;
}
