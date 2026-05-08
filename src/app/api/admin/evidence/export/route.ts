import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { listCases } from "@/lib/server/app-store";

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const caseId = request.nextUrl.searchParams.get("caseId")?.trim() ?? "";
  if (!caseId) {
    return NextResponse.json({ ok: false, error: "missing_case_id" }, { status: 400 });
  }

  const item = (await listCases()).find((entry) => entry.id === caseId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
  }

  await addAdminAuditEvent({
    action: "admin_case_export",
    status: "success",
    meta: { caseId, title: item.title },
  });

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      case: item,
    },
    null,
    2,
  );

  return new NextResponse(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"case-${caseId}.json\"`,
      "Cache-Control": "no-store",
    },
  });
}
