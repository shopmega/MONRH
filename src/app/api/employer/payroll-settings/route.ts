import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  getEmployerPayrollSettings,
  isEmployerCompanyAccessError,
  upsertEmployerPayrollSettings,
} from "@/lib/server/employer-core-store";

const accountingAccountsSchema = z.object({
  grossSalaryExpense: z.string().min(1).max(40),
  employerSocialChargesExpense: z.string().min(1).max(40),
  socialPayable: z.string().min(1).max(40),
  incomeTaxPayable: z.string().min(1).max(40),
  cimrPayable: z.string().min(1).max(40),
  netSalaryPayable: z.string().min(1).max(40),
});

const payrollRubricSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  category: z.enum(["bonus", "benefit", "allowance", "overtime", "deduction"]),
  taxable: z.boolean(),
  cnssSubject: z.boolean(),
  amoSubject: z.boolean(),
  active: z.boolean(),
});

const payrollSettingsSchema = z.object({
  defaultCompanySize: z.enum(["small", "large"]),
  includeCimrByDefault: z.boolean(),
  paymentMethod: z.enum(["bank_transfer", "cash", "mixed"]),
  accountingExportTemplate: z.enum(["generic", "sage", "odoo", "webisoft"]),
  accountingAccounts: accountingAccountsSchema,
  rubrics: z.array(payrollRubricSchema).max(200),
});

const savePayrollSettingsSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: payrollSettingsSchema,
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const companyId = request.nextUrl.searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ ok: false, error: "missing_company_id" }, { status: 400 });
    }

    const item = await getEmployerPayrollSettings(userId, companyId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_payroll_settings_unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = savePayrollSettingsSchema.parse(await request.json());
    const item = await upsertEmployerPayrollSettings(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_payroll_settings_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export const POST = PUT;
