import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isEmployerCompanyAccessError,
  listEmployerCnssExports,
  replaceEmployerCnssExports,
  upsertEmployerCnssExport,
} from "@/lib/server/employer-core-store";
import {
  canonicalizeEmployerCnssExportsForCompany,
  isEmployerPayrollValidationError,
} from "@/lib/server/employer-payroll-validation";
import { getCurrentUserId } from "@/lib/server/user-session";

const cnssRowSchema = z.object({
  employeeId: z.string().min(1).max(120),
  employeeName: z.string().min(1).max(180),
  employeeCin: z.string().max(100).default(""),
  cnssNumber: z.string().min(1).max(100),
  contractType: z.string().min(1).max(40),
  gross: z.number().nonnegative(),
  declaredDays: z.number().int().min(0).max(31).default(0),
  cnssBase: z.number().nonnegative(),
  cnssEmployee: z.number().nonnegative(),
  cnssEmployer: z.number().nonnegative(),
  totalCnss: z.number().nonnegative(),
});

const cnssTotalsSchema = z.object({
  employees: z.number().int().nonnegative(),
  gross: z.number().nonnegative(),
  cnssBase: z.number().nonnegative(),
  cnssEmployee: z.number().nonnegative(),
  cnssEmployer: z.number().nonnegative(),
  totalCnss: z.number().nonnegative(),
  missingCnss: z.number().int().nonnegative(),
});

const cnssExportSchema = z.object({
  id: z.string().min(1).max(120),
  payrollRunId: z.string().min(1).max(120).optional(),
  period: z.string().min(1).max(80),
  filename: z.string().min(1).max(180),
  status: z.enum(["prepared", "downloaded"]),
  createdAt: z.string().min(1),
  rows: z.array(cnssRowSchema).max(5000),
  totals: cnssTotalsSchema,
});

const saveCnssExportsSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(cnssExportSchema).max(240),
});

const saveCnssExportSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: cnssExportSchema,
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

    const items = await listEmployerCnssExports(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_cnss_exports_unavailable",
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

    const payload = saveCnssExportsSchema.parse(await request.json());
    const canonicalItems = await canonicalizeEmployerCnssExportsForCompany(userId, payload.companyId, payload.items);
    const items = await replaceEmployerCnssExports(userId, payload.companyId, canonicalItems);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    if (isEmployerPayrollValidationError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 422 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_cnss_exports_save_failed",
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

    const payload = saveCnssExportSchema.parse(await request.json());
    const [canonicalItem] = await canonicalizeEmployerCnssExportsForCompany(userId, payload.companyId, [payload.item]);
    const item = await upsertEmployerCnssExport(userId, payload.companyId, canonicalItem);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    if (isEmployerPayrollValidationError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 422 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_cnss_export_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
