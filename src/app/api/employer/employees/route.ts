import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  isEmployerCompanyAccessError,
  listEmployerEmployees,
  replaceEmployerEmployees,
  upsertEmployerEmployee,
} from "@/lib/server/employer-core-store";

const employeeDocumentSchema = z.object({
  type: z.enum(["contract", "cin", "cnss", "rib", "medical"]),
  label: z.string().min(1).max(120),
  attached: z.boolean(),
  updatedAt: z.string().optional(),
});

const employeeSchema = z.object({
  id: z.string().min(1).max(120),
  employeeNumber: z.string().min(1).max(120).optional(),
  fullName: z.string().min(1).max(180),
  cin: z.string().max(100).optional(),
  role: z.string().min(1).max(160),
  contractType: z.enum(["CDI", "CDD", "Stage", "Interim"]),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  grossSalary: z.number().nonnegative(),
  cnssNumber: z.string().min(1).max(100),
  childrenCount: z.number().int().min(0).max(6).optional(),
  email: z.string().email().optional(),
  documents: z.array(employeeDocumentSchema).optional(),
  status: z.enum(["Actif", "Suspendu", "Sorti"]),
});

const saveEmployeesSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(employeeSchema).max(5000),
});

const saveEmployeeSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: employeeSchema,
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

    const items = await listEmployerEmployees(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_employees_unavailable",
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

    const payload = saveEmployeesSchema.parse(await request.json());
    const items = await replaceEmployerEmployees(userId, payload.companyId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_employees_save_failed",
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

    const payload = saveEmployeeSchema.parse(await request.json());
    const item = await upsertEmployerEmployee(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_employee_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
