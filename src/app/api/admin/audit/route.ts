import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listAdminAuditEvents } from "@/lib/server/admin-audit-store";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const events = await listAdminAuditEvents();
  return NextResponse.json({ ok: true, events: events.slice(0, 300) });
}
