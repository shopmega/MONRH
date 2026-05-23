import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isEmployerCompanyAccessError,
  listEmployerContractRecords,
  replaceEmployerContractRecords,
  upsertEmployerContractRecord,
} from "@/lib/server/employer-core-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const contractWarningSchema = z.object({
  field: z.string().min(1).max(120),
  message: z.string().min(1).max(600),
});

const contractRecordSchema = z.object({
  id: z.string().min(1).max(120),
  generatedContractId: z.string().min(1).max(120).optional(),
  employeeId: z.string().min(1).max(120).optional(),
  employeeName: z.string().min(1).max(180),
  contractType: z.enum(["CDI", "CDD", "INTERIM", "STAGE"]),
  contractDate: z.string().min(1),
  status: z.enum(["generated", "downloaded"]),
  filename: z.string().min(1).max(180),
  content: z.string().min(1),
  contractData: z.record(z.string(), z.unknown()),
  warnings: z.array(contractWarningSchema).optional(),
  createdAt: z.string().min(1),
});

const saveContractRecordsSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(contractRecordSchema).max(500),
});

const saveContractRecordSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: contractRecordSchema,
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

    const items = await listEmployerContractRecords(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_contract_records_unavailable",
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

    const payload = saveContractRecordsSchema.parse(await request.json());
    const items = await replaceEmployerContractRecords(userId, payload.companyId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_contract_records_save_failed",
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

    const payload = saveContractRecordSchema.parse(await request.json());
    const item = await upsertEmployerContractRecord(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_contract_record_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
