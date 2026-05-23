import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  isEmployerCompanyAccessError,
  listEmployerTimeEntries,
  replaceEmployerTimeEntries,
  upsertEmployerTimeEntry,
} from "@/lib/server/employer-core-store";

const timeEntrySchema = z.object({
  id: z.string().min(1).max(120),
  employeeId: z.string().min(1).max(120),
  employeeName: z.string().min(1).max(180),
  weekStart: z.string().min(1),
  regularHours: z.number().nonnegative(),
  overtimeDayHours: z.number().nonnegative(),
  overtimeNightHours: z.number().nonnegative(),
  overtimeRestOrHolidayDayHours: z.number().nonnegative(),
  overtimeRestOrHolidayNightHours: z.number().nonnegative(),
  overtimeAmount: z.number().nonnegative(),
  status: z.enum(["draft", "approved", "rejected"]),
  note: z.string().min(1).max(600),
  createdAt: z.string().min(1),
  decidedAt: z.string().optional(),
});

const saveTimeEntriesSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(timeEntrySchema).max(5000),
});

const saveTimeEntrySchema = z.object({
  companyId: z.string().min(1).max(120),
  item: timeEntrySchema,
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

    const items = await listEmployerTimeEntries(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_time_entries_unavailable",
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

    const payload = saveTimeEntriesSchema.parse(await request.json());
    const items = await replaceEmployerTimeEntries(userId, payload.companyId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_time_entries_save_failed",
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

    const payload = saveTimeEntrySchema.parse(await request.json());
    const item = await upsertEmployerTimeEntry(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_time_entry_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
