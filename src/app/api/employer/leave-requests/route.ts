import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  isEmployerCompanyAccessError,
  listEmployerLeaveRequests,
  replaceEmployerLeaveRequests,
  upsertEmployerLeaveRequest,
} from "@/lib/server/employer-core-store";

const leaveRequestSchema = z.object({
  id: z.string().min(1).max(120),
  employeeId: z.string().min(1).max(120),
  employeeName: z.string().min(1).max(180),
  type: z.enum(["paid", "sick", "unpaid", "exceptional"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().positive(),
  status: z.enum(["pending", "approved", "rejected"]),
  reason: z.string().min(1).max(600),
  createdAt: z.string().min(1),
  decidedAt: z.string().optional(),
});

const saveLeaveRequestsSchema = z.object({
  companyId: z.string().min(1).max(120),
  items: z.array(leaveRequestSchema).max(5000),
});

const saveLeaveRequestSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: leaveRequestSchema,
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

    const items = await listEmployerLeaveRequests(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_leave_requests_unavailable",
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

    const payload = saveLeaveRequestsSchema.parse(await request.json());
    const items = await replaceEmployerLeaveRequests(userId, payload.companyId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_leave_requests_save_failed",
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

    const payload = saveLeaveRequestSchema.parse(await request.json());
    const item = await upsertEmployerLeaveRequest(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_leave_request_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
