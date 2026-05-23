import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteEmployerComplianceDismissals,
  isEmployerCompanyAccessError,
  listEmployerComplianceDismissals,
  upsertEmployerComplianceDismissal,
} from "@/lib/server/employer-core-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const complianceDismissalSchema = z.object({
  alertId: z.string().min(1).max(240),
  reason: z.string().min(1).max(500),
  dismissedAt: z.string().min(1),
});

const saveComplianceDismissalSchema = z.object({
  companyId: z.string().min(1).max(120),
  item: complianceDismissalSchema,
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

    const items = await listEmployerComplianceDismissals(userId, companyId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_compliance_dismissals_unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = saveComplianceDismissalSchema.parse(await request.json());
    const item = await upsertEmployerComplianceDismissal(userId, payload.companyId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_compliance_dismissal_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const companyId = request.nextUrl.searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ ok: false, error: "missing_company_id" }, { status: 400 });
    }

    await deleteEmployerComplianceDismissals(userId, companyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isEmployerCompanyAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_compliance_dismissals_delete_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
