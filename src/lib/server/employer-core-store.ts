import { defaultEmployerPayrollSettings } from "@/lib/employer/portal-data";
import type {
  EmployerCompany,
  EmployerComplianceDismissal,
  EmployerCnssExport,
  EmployerContractRecord,
  EmployerEmployee,
  EmployerLeaveRequest,
  EmployerPayrollSettings,
  EmployerPayrollRun,
  EmployerTimeEntry,
} from "@/lib/employer/portal-data";
import { getEmployerPlanLimit, getEmployerSubscriptionPlan } from "@/lib/server/employer-subscription-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

type CompanyRow = {
  id: string;
  name: string;
  legal_form: string | null;
  address: string | null;
  ice: string;
  tax_identifier: string | null;
  rc_number: string | null;
  cnss_affiliate_number: string;
  city: string;
  contact_email: string | null;
  bank_rib: string | null;
  signatory_name: string | null;
  signatory_role: string | null;
  plan: EmployerCompany["plan"];
};

type EmployeeRow = {
  id: string;
  employee_number: string;
  full_name: string;
  cin: string;
  role: string;
  contract_type: EmployerEmployee["contractType"];
  start_date: string;
  end_date: string | null;
  gross_salary: number | string;
  cnss_number: string;
  children_count: number | string;
  email: string | null;
  documents: EmployerEmployee["documents"];
  status: EmployerEmployee["status"];
};

type PayrollRunRow = {
  id: string;
  period: string;
  run_created_at: string;
  lines: EmployerPayrollRun["lines"];
};

type PayrollSettingsRow = {
  settings: Partial<EmployerPayrollSettings> | null;
};

type LeaveRequestRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: EmployerLeaveRequest["type"];
  start_date: string;
  end_date: string;
  days: number | string;
  status: EmployerLeaveRequest["status"];
  reason: string;
  request_created_at: string;
  decided_at: string | null;
};

type TimeEntryRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  week_start: string;
  regular_hours: number | string;
  overtime_day_hours: number | string;
  overtime_night_hours: number | string;
  overtime_rest_or_holiday_day_hours: number | string;
  overtime_rest_or_holiday_night_hours: number | string;
  overtime_amount: number | string;
  status: EmployerTimeEntry["status"];
  note: string;
  entry_created_at: string;
  decided_at: string | null;
};

type CnssExportRow = {
  id: string;
  payroll_run_id: string | null;
  period: string;
  filename: string;
  status: EmployerCnssExport["status"];
  export_created_at: string;
  rows: EmployerCnssExport["rows"];
  totals: EmployerCnssExport["totals"];
};

type ComplianceDismissalRow = {
  alert_id: string;
  reason: string;
  dismissed_at: string;
};

type ContractRecordRow = {
  id: string;
  generated_contract_id: string | null;
  employee_id: string | null;
  employee_name: string;
  contract_type: EmployerContractRecord["contractType"];
  contract_date: string;
  status: EmployerContractRecord["status"];
  filename: string;
  content: string;
  contract_data: EmployerContractRecord["contractData"];
  warnings: EmployerContractRecord["warnings"];
  record_created_at: string;
};

export class EmployerCompanyAccessError extends Error {
  code = "employer_company_access_denied";

  constructor(companyId: string) {
    super(`Employer company access denied: ${companyId}`);
  }
}

export function isEmployerCompanyAccessError(error: unknown): error is EmployerCompanyAccessError {
  return error instanceof EmployerCompanyAccessError;
}

export class EmployerPlanLimitError extends Error {
  code = "employer_plan_limit_exceeded";

  constructor(message: string) {
    super(message);
  }
}

export function isEmployerPlanLimitError(error: unknown): error is EmployerPlanLimitError {
  return error instanceof EmployerPlanLimitError;
}

async function assertEmployerCompanyAccess(userId: string, companyId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_companies")
    .select("id")
    .eq("user_id", userId)
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw new Error(`employer_company_access_check_failed: ${error.message}`);
  if (!data) throw new EmployerCompanyAccessError(companyId);
}

async function assertCompanyCountWithinPlan(userId: string, nextCompanyCount: number) {
  const plan = await getEmployerSubscriptionPlan(userId);
  const maxCompanies = getEmployerPlanLimit(plan, "maxCompanies");
  if (nextCompanyCount > maxCompanies) {
    throw new EmployerPlanLimitError(`plan_${plan}_allows_${maxCompanies}_companies`);
  }
  return plan;
}

function mapCompany(row: CompanyRow): EmployerCompany {
  return {
    id: row.id,
    name: row.name,
    legalForm: row.legal_form ?? undefined,
    address: row.address ?? undefined,
    ice: row.ice,
    taxIdentifier: row.tax_identifier ?? undefined,
    rcNumber: row.rc_number ?? undefined,
    cnssAffiliateNumber: row.cnss_affiliate_number,
    city: row.city,
    contactEmail: row.contact_email ?? undefined,
    bankRib: row.bank_rib ?? undefined,
    signatoryName: row.signatory_name ?? undefined,
    signatoryRole: row.signatory_role ?? undefined,
    plan: row.plan,
  };
}

function mapEmployee(row: EmployeeRow): EmployerEmployee {
  return {
    id: row.id,
    employeeNumber: row.employee_number || row.id,
    fullName: row.full_name,
    cin: row.cin,
    role: row.role,
    contractType: row.contract_type,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    grossSalary: Number(row.gross_salary),
    cnssNumber: row.cnss_number,
    childrenCount: Number(row.children_count),
    email: row.email ?? undefined,
    documents: row.documents ?? [],
    status: row.status,
  };
}

function mapPayrollRun(row: PayrollRunRow): EmployerPayrollRun {
  return {
    id: row.id,
    period: row.period,
    createdAt: row.run_created_at,
    lines: row.lines ?? [],
  };
}

function normalizeEmployerPayrollSettings(settings: Partial<EmployerPayrollSettings> | null): EmployerPayrollSettings {
  return {
    ...defaultEmployerPayrollSettings,
    ...(settings ?? {}),
    accountingAccounts: {
      ...defaultEmployerPayrollSettings.accountingAccounts,
      ...(settings?.accountingAccounts ?? {}),
    },
    rubrics: Array.isArray(settings?.rubrics) && settings.rubrics.length > 0
      ? settings.rubrics
      : defaultEmployerPayrollSettings.rubrics,
  };
}

function mapPayrollSettings(row: PayrollSettingsRow | null): EmployerPayrollSettings {
  return normalizeEmployerPayrollSettings(row?.settings ?? null);
}

function mapLeaveRequest(row: LeaveRequestRow): EmployerLeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    type: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.days),
    status: row.status,
    reason: row.reason,
    createdAt: row.request_created_at,
    decidedAt: row.decided_at ?? undefined,
  };
}

function mapTimeEntry(row: TimeEntryRow): EmployerTimeEntry {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    weekStart: row.week_start,
    regularHours: Number(row.regular_hours),
    overtimeDayHours: Number(row.overtime_day_hours),
    overtimeNightHours: Number(row.overtime_night_hours),
    overtimeRestOrHolidayDayHours: Number(row.overtime_rest_or_holiday_day_hours),
    overtimeRestOrHolidayNightHours: Number(row.overtime_rest_or_holiday_night_hours),
    overtimeAmount: Number(row.overtime_amount),
    status: row.status,
    note: row.note,
    createdAt: row.entry_created_at,
    decidedAt: row.decided_at ?? undefined,
  };
}

function mapCnssExport(row: CnssExportRow): EmployerCnssExport {
  return {
    id: row.id,
    payrollRunId: row.payroll_run_id ?? undefined,
    period: row.period,
    filename: row.filename,
    status: row.status,
    createdAt: row.export_created_at,
    rows: row.rows ?? [],
    totals: row.totals,
  };
}

function mapComplianceDismissal(row: ComplianceDismissalRow): EmployerComplianceDismissal {
  return {
    alertId: row.alert_id,
    reason: row.reason,
    dismissedAt: row.dismissed_at,
  };
}

function mapContractRecord(row: ContractRecordRow): EmployerContractRecord {
  return {
    id: row.id,
    generatedContractId: row.generated_contract_id ?? undefined,
    employeeId: row.employee_id ?? undefined,
    employeeName: row.employee_name,
    contractType: row.contract_type,
    contractDate: row.contract_date,
    status: row.status,
    filename: row.filename,
    content: row.content,
    contractData: row.contract_data ?? {},
    warnings: row.warnings ?? [],
    createdAt: row.record_created_at,
  };
}

async function deleteEmployerChildRowsExcept(
  table: string,
  userId: string,
  companyId: string,
  nextIds: Set<string>,
  idColumn = "id",
) {
  const supabase = getSupabaseAdminClient();
  if (nextIds.size === 0) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("company_id", companyId);
    if (error) throw new Error(`${table}_replace_delete_failed: ${error.message}`);
    return;
  }

  const { data, error: selectError } = await (supabase as any)
    .from(table)
    .select(idColumn)
    .eq("user_id", userId)
    .eq("company_id", companyId);
  if (selectError) throw new Error(`${table}_replace_select_failed: ${selectError.message}`);

  for (const row of (data ?? []) as Array<Record<string, string>>) {
    const id = row[idColumn];
    if (nextIds.has(id)) continue;
    const { error: deleteError } = await (supabase as any)
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq(idColumn, id);
    if (deleteError) throw new Error(`${table}_replace_delete_failed: ${deleteError.message}`);
  }
}

export async function listEmployerCompanies(userId: string): Promise<EmployerCompany[]> {
  const supabase = getSupabaseAdminClient();
  const plan = await getEmployerSubscriptionPlan(userId);
  const { data, error } = await (supabase as any)
    .from("employer_companies")
    .select("id,name,legal_form,address,ice,tax_identifier,rc_number,cnss_affiliate_number,city,contact_email,bank_rib,signatory_name,signatory_role,plan")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`employer_companies_list_failed: ${error.message}`);
  return ((data ?? []) as CompanyRow[]).map((row) => ({ ...mapCompany(row), plan }));
}

export async function replaceEmployerCompanies(
  userId: string,
  companies: EmployerCompany[],
): Promise<EmployerCompany[]> {
  const supabase = getSupabaseAdminClient();
  const existingCompanies = await listEmployerCompanies(userId);
  const existingPlans = new Map(existingCompanies.map((company) => [company.id, company.plan]));
  const nextCompanyIds = new Set(companies.map((company) => company.id));
  const plan = await assertCompanyCountWithinPlan(userId, nextCompanyIds.size);

  if (companies.length > 0) {
    const rows = companies.map((company) => ({
      user_id: userId,
      id: company.id,
      name: company.name,
      legal_form: company.legalForm ?? null,
      address: company.address ?? null,
      ice: company.ice,
      tax_identifier: company.taxIdentifier ?? null,
      rc_number: company.rcNumber ?? null,
      cnss_affiliate_number: company.cnssAffiliateNumber,
      city: company.city,
      contact_email: company.contactEmail ?? null,
      bank_rib: company.bankRib ?? null,
      signatory_name: company.signatoryName ?? null,
      signatory_role: company.signatoryRole ?? null,
      plan: existingPlans.get(company.id) ?? plan,
    }));
    const { error: upsertError } = await (supabase as any)
      .from("employer_companies")
      .upsert(rows, { onConflict: "user_id,id" });
    if (upsertError) throw new Error(`employer_companies_replace_failed: ${upsertError.message}`);
  }

  for (const company of existingCompanies) {
    if (!nextCompanyIds.has(company.id)) {
      const { error: deleteError } = await (supabase as any)
        .from("employer_companies")
        .delete()
        .eq("user_id", userId)
        .eq("id", company.id);
      if (deleteError) throw new Error(`employer_companies_replace_failed: ${deleteError.message}`);
    }
  }

  return listEmployerCompanies(userId);
}

export async function upsertEmployerCompany(userId: string, company: EmployerCompany): Promise<EmployerCompany> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await (supabase as any)
    .from("employer_companies")
    .select("plan")
    .eq("user_id", userId)
    .eq("id", company.id)
    .maybeSingle();

  if (existingError) throw new Error(`employer_company_upsert_failed: ${existingError.message}`);
  const existingCompanies = await listEmployerCompanies(userId);
  const isNewCompany = !existingCompanies.some((item) => item.id === company.id);
  const plan = await assertCompanyCountWithinPlan(userId, existingCompanies.length + (isNewCompany ? 1 : 0));

  const row = {
    user_id: userId,
    id: company.id,
    name: company.name,
    legal_form: company.legalForm ?? null,
    address: company.address ?? null,
    ice: company.ice,
    tax_identifier: company.taxIdentifier ?? null,
    rc_number: company.rcNumber ?? null,
    cnss_affiliate_number: company.cnssAffiliateNumber,
    city: company.city,
    contact_email: company.contactEmail ?? null,
    bank_rib: company.bankRib ?? null,
    signatory_name: company.signatoryName ?? null,
    signatory_role: company.signatoryRole ?? null,
    plan: (existing as { plan?: EmployerCompany["plan"] } | null)?.plan ?? plan,
  };

  const { data, error } = await (supabase as any)
    .from("employer_companies")
    .upsert(row, { onConflict: "user_id,id" })
    .select("id,name,legal_form,address,ice,tax_identifier,rc_number,cnss_affiliate_number,city,contact_email,bank_rib,signatory_name,signatory_role,plan")
    .single();
  if (error) throw new Error(`employer_company_upsert_failed: ${error.message}`);
  return { ...mapCompany(data as CompanyRow), plan };
}

export async function listEmployerEmployees(userId: string, companyId: string): Promise<EmployerEmployee[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_employees")
    .select("id,employee_number,full_name,cin,role,contract_type,start_date,end_date,gross_salary,cnss_number,children_count,email,documents,status")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`employer_employees_list_failed: ${error.message}`);
  return ((data ?? []) as EmployeeRow[]).map(mapEmployee);
}

export async function replaceEmployerEmployees(
  userId: string,
  companyId: string,
  employees: EmployerEmployee[],
): Promise<EmployerEmployee[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (employees.length > 0) {
    const rows = employees.map((employee) => ({
      user_id: userId,
      company_id: companyId,
      id: employee.id,
      employee_number: employee.employeeNumber ?? employee.id,
      full_name: employee.fullName,
      cin: employee.cin ?? "",
      role: employee.role,
      contract_type: employee.contractType,
      start_date: employee.startDate,
      end_date: employee.endDate ?? null,
      gross_salary: employee.grossSalary,
      cnss_number: employee.cnssNumber,
      children_count: employee.childrenCount ?? 0,
      email: employee.email ?? null,
      documents: employee.documents ?? [],
      status: employee.status,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_employees")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_employees_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_employees",
    userId,
    companyId,
    new Set(employees.map((employee) => employee.id)),
  );

  return listEmployerEmployees(userId, companyId);
}

export async function upsertEmployerEmployee(
  userId: string,
  companyId: string,
  employee: EmployerEmployee,
): Promise<EmployerEmployee> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: employee.id,
    employee_number: employee.employeeNumber ?? employee.id,
    full_name: employee.fullName,
    cin: employee.cin ?? "",
    role: employee.role,
    contract_type: employee.contractType,
    start_date: employee.startDate,
    end_date: employee.endDate ?? null,
    gross_salary: employee.grossSalary,
    cnss_number: employee.cnssNumber,
    children_count: employee.childrenCount ?? 0,
    email: employee.email ?? null,
    documents: employee.documents ?? [],
    status: employee.status,
  };
  const { data, error } = await (supabase as any)
    .from("employer_employees")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select("id,employee_number,full_name,cin,role,contract_type,start_date,end_date,gross_salary,cnss_number,children_count,email,documents,status")
    .single();
  if (error) throw new Error(`employer_employee_upsert_failed: ${error.message}`);
  return mapEmployee(data as EmployeeRow);
}

export async function listEmployerPayrollRuns(userId: string, companyId: string): Promise<EmployerPayrollRun[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_payroll_runs")
    .select("id,period,run_created_at,lines")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("run_created_at", { ascending: false });

  if (error) throw new Error(`employer_payroll_runs_list_failed: ${error.message}`);
  return ((data ?? []) as PayrollRunRow[]).map(mapPayrollRun);
}

export async function replaceEmployerPayrollRuns(
  userId: string,
  companyId: string,
  runs: EmployerPayrollRun[],
): Promise<EmployerPayrollRun[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (runs.length > 0) {
    const rows = runs.map((run) => ({
      user_id: userId,
      company_id: companyId,
      id: run.id,
      period: run.period,
      run_created_at: run.createdAt,
      lines: run.lines,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_payroll_runs")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_payroll_runs_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_payroll_runs",
    userId,
    companyId,
    new Set(runs.map((run) => run.id)),
  );

  return listEmployerPayrollRuns(userId, companyId);
}

export async function upsertEmployerPayrollRun(
  userId: string,
  companyId: string,
  run: EmployerPayrollRun,
): Promise<EmployerPayrollRun> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: run.id,
    period: run.period,
    run_created_at: run.createdAt,
    lines: run.lines,
  };
  const { data, error } = await (supabase as any)
    .from("employer_payroll_runs")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select("id,period,run_created_at,lines")
    .single();
  if (error) throw new Error(`employer_payroll_run_upsert_failed: ${error.message}`);
  return mapPayrollRun(data as PayrollRunRow);
}

export async function getEmployerPayrollSettings(
  userId: string,
  companyId: string,
): Promise<EmployerPayrollSettings> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_payroll_settings")
    .select("settings")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(`employer_payroll_settings_get_failed: ${error.message}`);
  return mapPayrollSettings(data as PayrollSettingsRow | null);
}

export async function upsertEmployerPayrollSettings(
  userId: string,
  companyId: string,
  settings: EmployerPayrollSettings,
): Promise<EmployerPayrollSettings> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const normalizedSettings = normalizeEmployerPayrollSettings(settings);
  const { data, error } = await (supabase as any)
    .from("employer_payroll_settings")
    .upsert(
      {
        user_id: userId,
        company_id: companyId,
        settings: normalizedSettings,
      },
      { onConflict: "user_id,company_id" },
    )
    .select("settings")
    .single();
  if (error) throw new Error(`employer_payroll_settings_upsert_failed: ${error.message}`);
  return mapPayrollSettings(data as PayrollSettingsRow);
}

export async function listEmployerLeaveRequests(userId: string, companyId: string): Promise<EmployerLeaveRequest[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_leave_requests")
    .select("id,employee_id,employee_name,leave_type,start_date,end_date,days,status,reason,request_created_at,decided_at")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("request_created_at", { ascending: false });

  if (error) throw new Error(`employer_leave_requests_list_failed: ${error.message}`);
  return ((data ?? []) as LeaveRequestRow[]).map(mapLeaveRequest);
}

export async function replaceEmployerLeaveRequests(
  userId: string,
  companyId: string,
  requests: EmployerLeaveRequest[],
): Promise<EmployerLeaveRequest[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (requests.length > 0) {
    const rows = requests.map((request) => ({
      user_id: userId,
      company_id: companyId,
      id: request.id,
      employee_id: request.employeeId,
      employee_name: request.employeeName,
      leave_type: request.type,
      start_date: request.startDate,
      end_date: request.endDate,
      days: request.days,
      status: request.status,
      reason: request.reason,
      request_created_at: request.createdAt,
      decided_at: request.decidedAt ?? null,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_leave_requests")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_leave_requests_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_leave_requests",
    userId,
    companyId,
    new Set(requests.map((request) => request.id)),
  );

  return listEmployerLeaveRequests(userId, companyId);
}

export async function upsertEmployerLeaveRequest(
  userId: string,
  companyId: string,
  request: EmployerLeaveRequest,
): Promise<EmployerLeaveRequest> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: request.id,
    employee_id: request.employeeId,
    employee_name: request.employeeName,
    leave_type: request.type,
    start_date: request.startDate,
    end_date: request.endDate,
    days: request.days,
    status: request.status,
    reason: request.reason,
    request_created_at: request.createdAt,
    decided_at: request.decidedAt ?? null,
  };
  const { data, error } = await (supabase as any)
    .from("employer_leave_requests")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select("id,employee_id,employee_name,leave_type,start_date,end_date,days,status,reason,request_created_at,decided_at")
    .single();
  if (error) throw new Error(`employer_leave_request_upsert_failed: ${error.message}`);
  return mapLeaveRequest(data as LeaveRequestRow);
}

export async function listEmployerTimeEntries(userId: string, companyId: string): Promise<EmployerTimeEntry[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_time_entries")
    .select(
      "id,employee_id,employee_name,week_start,regular_hours,overtime_day_hours,overtime_night_hours,overtime_rest_or_holiday_day_hours,overtime_rest_or_holiday_night_hours,overtime_amount,status,note,entry_created_at,decided_at",
    )
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("week_start", { ascending: false });

  if (error) throw new Error(`employer_time_entries_list_failed: ${error.message}`);
  return ((data ?? []) as TimeEntryRow[]).map(mapTimeEntry);
}

export async function replaceEmployerTimeEntries(
  userId: string,
  companyId: string,
  entries: EmployerTimeEntry[],
): Promise<EmployerTimeEntry[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (entries.length > 0) {
    const rows = entries.map((entry) => ({
      user_id: userId,
      company_id: companyId,
      id: entry.id,
      employee_id: entry.employeeId,
      employee_name: entry.employeeName,
      week_start: entry.weekStart,
      regular_hours: entry.regularHours,
      overtime_day_hours: entry.overtimeDayHours,
      overtime_night_hours: entry.overtimeNightHours,
      overtime_rest_or_holiday_day_hours: entry.overtimeRestOrHolidayDayHours,
      overtime_rest_or_holiday_night_hours: entry.overtimeRestOrHolidayNightHours,
      overtime_amount: entry.overtimeAmount,
      status: entry.status,
      note: entry.note,
      entry_created_at: entry.createdAt,
      decided_at: entry.decidedAt ?? null,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_time_entries")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_time_entries_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_time_entries",
    userId,
    companyId,
    new Set(entries.map((entry) => entry.id)),
  );

  return listEmployerTimeEntries(userId, companyId);
}

export async function upsertEmployerTimeEntry(
  userId: string,
  companyId: string,
  entry: EmployerTimeEntry,
): Promise<EmployerTimeEntry> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: entry.id,
    employee_id: entry.employeeId,
    employee_name: entry.employeeName,
    week_start: entry.weekStart,
    regular_hours: entry.regularHours,
    overtime_day_hours: entry.overtimeDayHours,
    overtime_night_hours: entry.overtimeNightHours,
    overtime_rest_or_holiday_day_hours: entry.overtimeRestOrHolidayDayHours,
    overtime_rest_or_holiday_night_hours: entry.overtimeRestOrHolidayNightHours,
    overtime_amount: entry.overtimeAmount,
    status: entry.status,
    note: entry.note,
    entry_created_at: entry.createdAt,
    decided_at: entry.decidedAt ?? null,
  };
  const { data, error } = await (supabase as any)
    .from("employer_time_entries")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select(
      "id,employee_id,employee_name,week_start,regular_hours,overtime_day_hours,overtime_night_hours,overtime_rest_or_holiday_day_hours,overtime_rest_or_holiday_night_hours,overtime_amount,status,note,entry_created_at,decided_at",
    )
    .single();
  if (error) throw new Error(`employer_time_entry_upsert_failed: ${error.message}`);
  return mapTimeEntry(data as TimeEntryRow);
}

export async function listEmployerCnssExports(userId: string, companyId: string): Promise<EmployerCnssExport[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_cnss_exports")
    .select("id,payroll_run_id,period,filename,status,export_created_at,rows,totals")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("export_created_at", { ascending: false });

  if (error) throw new Error(`employer_cnss_exports_list_failed: ${error.message}`);
  return ((data ?? []) as CnssExportRow[]).map(mapCnssExport);
}

export async function replaceEmployerCnssExports(
  userId: string,
  companyId: string,
  exports: EmployerCnssExport[],
): Promise<EmployerCnssExport[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (exports.length > 0) {
    const rows = exports.map((item) => ({
      user_id: userId,
      company_id: companyId,
      id: item.id,
      payroll_run_id: item.payrollRunId ?? null,
      period: item.period,
      filename: item.filename,
      status: item.status,
      export_created_at: item.createdAt,
      rows: item.rows,
      totals: item.totals,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_cnss_exports")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_cnss_exports_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_cnss_exports",
    userId,
    companyId,
    new Set(exports.map((item) => item.id)),
  );

  return listEmployerCnssExports(userId, companyId);
}

export async function upsertEmployerCnssExport(
  userId: string,
  companyId: string,
  cnssExport: EmployerCnssExport,
): Promise<EmployerCnssExport> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: cnssExport.id,
    payroll_run_id: cnssExport.payrollRunId ?? null,
    period: cnssExport.period,
    filename: cnssExport.filename,
    status: cnssExport.status,
    export_created_at: cnssExport.createdAt,
    rows: cnssExport.rows,
    totals: cnssExport.totals,
  };
  const { data, error } = await (supabase as any)
    .from("employer_cnss_exports")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select("id,payroll_run_id,period,filename,status,export_created_at,rows,totals")
    .single();
  if (error) throw new Error(`employer_cnss_export_upsert_failed: ${error.message}`);
  return mapCnssExport(data as CnssExportRow);
}

export async function listEmployerComplianceDismissals(
  userId: string,
  companyId: string,
): Promise<EmployerComplianceDismissal[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_compliance_dismissals")
    .select("alert_id,reason,dismissed_at")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("dismissed_at", { ascending: false });

  if (error) throw new Error(`employer_compliance_dismissals_list_failed: ${error.message}`);
  return ((data ?? []) as ComplianceDismissalRow[]).map(mapComplianceDismissal);
}

export async function upsertEmployerComplianceDismissal(
  userId: string,
  companyId: string,
  dismissal: EmployerComplianceDismissal,
): Promise<EmployerComplianceDismissal> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    alert_id: dismissal.alertId,
    reason: dismissal.reason,
    dismissed_at: dismissal.dismissedAt,
  };
  const { data, error } = await (supabase as any)
    .from("employer_compliance_dismissals")
    .upsert(row, { onConflict: "user_id,company_id,alert_id" })
    .select("alert_id,reason,dismissed_at")
    .single();
  if (error) throw new Error(`employer_compliance_dismissal_upsert_failed: ${error.message}`);
  return mapComplianceDismissal(data as ComplianceDismissalRow);
}

export async function deleteEmployerComplianceDismissals(userId: string, companyId: string): Promise<void> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { error } = await (supabase as any)
    .from("employer_compliance_dismissals")
    .delete()
    .eq("user_id", userId)
    .eq("company_id", companyId);
  if (error) throw new Error(`employer_compliance_dismissals_delete_failed: ${error.message}`);
}

export async function listEmployerContractRecords(userId: string, companyId: string): Promise<EmployerContractRecord[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_contract_records")
    .select(
      "id,generated_contract_id,employee_id,employee_name,contract_type,contract_date,status,filename,content,contract_data,warnings,record_created_at",
    )
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("record_created_at", { ascending: false });

  if (error) throw new Error(`employer_contract_records_list_failed: ${error.message}`);
  return ((data ?? []) as ContractRecordRow[]).map(mapContractRecord);
}

export async function replaceEmployerContractRecords(
  userId: string,
  companyId: string,
  records: EmployerContractRecord[],
): Promise<EmployerContractRecord[]> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();

  if (records.length > 0) {
    const rows = records.map((record) => ({
      user_id: userId,
      company_id: companyId,
      id: record.id,
      generated_contract_id: record.generatedContractId ?? null,
      employee_id: record.employeeId ?? null,
      employee_name: record.employeeName,
      contract_type: record.contractType,
      contract_date: record.contractDate,
      status: record.status,
      filename: record.filename,
      content: record.content,
      contract_data: record.contractData,
      warnings: record.warnings ?? [],
      record_created_at: record.createdAt,
    }));
    const { error: insertError } = await (supabase as any)
      .from("employer_contract_records")
      .upsert(rows, { onConflict: "user_id,company_id,id" });
    if (insertError) throw new Error(`employer_contract_records_replace_failed: ${insertError.message}`);
  }
  await deleteEmployerChildRowsExcept(
    "employer_contract_records",
    userId,
    companyId,
    new Set(records.map((record) => record.id)),
  );

  return listEmployerContractRecords(userId, companyId);
}

export async function upsertEmployerContractRecord(
  userId: string,
  companyId: string,
  record: EmployerContractRecord,
): Promise<EmployerContractRecord> {
  await assertEmployerCompanyAccess(userId, companyId);
  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    company_id: companyId,
    id: record.id,
    generated_contract_id: record.generatedContractId ?? null,
    employee_id: record.employeeId ?? null,
    employee_name: record.employeeName,
    contract_type: record.contractType,
    contract_date: record.contractDate,
    status: record.status,
    filename: record.filename,
    content: record.content,
    contract_data: record.contractData,
    warnings: record.warnings ?? [],
    record_created_at: record.createdAt,
  };
  const { data, error } = await (supabase as any)
    .from("employer_contract_records")
    .upsert(row, { onConflict: "user_id,company_id,id" })
    .select(
      "id,generated_contract_id,employee_id,employee_name,contract_type,contract_date,status,filename,content,contract_data,warnings,record_created_at",
    )
    .single();
  if (error) throw new Error(`employer_contract_record_upsert_failed: ${error.message}`);
  return mapContractRecord(data as ContractRecordRow);
}
