import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  isEmployerCompanyAccessError,
  listEmployerPayrollRuns,
  replaceEmployerPayrollRuns,
  upsertEmployerPayrollRun,
} from "@/lib/server/employer-core-store";

const payrollResultSchema = z.object({
  period: z.string().min(1),
  employeeName: z.string().min(1),
  calculationDate: z.string().optional(),
  earnings: z.object({
    baseSalary: z.number().optional(),
    overtimePay: z.number().optional(),
    bonus: z.number().optional(),
    allowances: z.number().optional(),
    totalGross: z.number(),
  }),
  deductions: z.object({
    cnssEmployeeShortTerm: z.number().optional(),
    cnssEmployeeLongTerm: z.number().optional(),
    cnssEmployee: z.number(),
    amoEmployee: z.number(),
    cimrEmployee: z.number().optional(),
    professionalExpenseDeduction: z.number().optional(),
    taxableIncome: z.number().optional(),
    familyTaxReduction: z.number().optional(),
    incomeTax: z.number(),
    totalDeductions: z.number(),
  }),
  netToPay: z.number(),
  employerContributions: z.object({
    cnssEmployerShortTerm: z.number().optional(),
    cnssEmployerLongTerm: z.number().optional(),
    cnssEmployer: z.number(),
    familyAllowanceEmployer: z.number().optional(),
    amoEmployer: z.number(),
    formationPro: z.number(),
    totalEmployerCost: z.number(),
  }),
  explanation: z.object({
    versionCode: z.string().optional(),
    warnings: z.array(z.string()).optional(),
  }).optional(),
});

const payrollRunSchema = z.object({
  id: z.string().min(1).max(120),
  period: z.string().min(1).max(80),
  createdAt: z.string().min(1),
  lines: z.array(z.object({
    employeeId: z.string().min(1).max(120),
    employeeName: z.string().min(1).max(180),
    result: payrollResultSchema,
  })).max(5000),
});

const savePayrollRunsSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(payrollRunSchema).max(120),
});

const savePayrollRunSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: payrollRunSchema,
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

    const items = await listEmployerPayrollRuns(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_payroll_runs_unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = savePayrollRunsSchema.parse(await request.json());
    const items = await replaceEmployerPayrollRuns(userId, payload.companyId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_payroll_runs_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export const PUT = POST;

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = savePayrollRunSchema.parse(await request.json());
    const item = await upsertEmployerPayrollRun(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_payroll_run_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
