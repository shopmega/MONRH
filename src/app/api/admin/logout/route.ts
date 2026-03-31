import { NextRequest, NextResponse } from "next/server";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { createSupabaseRouteClient, jsonWithForwardedCookies } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    await addAdminAuditEvent({
      action: "admin_logout",
      status: "failed",
      meta: { reason: "invalid_origin" },
    });
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const cookieCarrier = NextResponse.next();
  let supabase: ReturnType<typeof createSupabaseRouteClient>;
  try {
    supabase = createSupabaseRouteClient(request, cookieCarrier);
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_config_invalid" }, { status: 503 });
  }

  await supabase.auth.signOut();
  await addAdminAuditEvent({
    action: "admin_logout",
    status: "success",
  });
  return jsonWithForwardedCookies(cookieCarrier, { ok: true }, 200);
}
