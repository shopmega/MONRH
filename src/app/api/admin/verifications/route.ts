import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listEmploymentVerificationsAdmin } from "@/lib/server/verification-store";

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status")?.trim() || undefined;
  const limitParam = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 300) : undefined;

  const items = await listEmploymentVerificationsAdmin({
    status,
    limit,
  });

  return NextResponse.json({ ok: true, items });
}
