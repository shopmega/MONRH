import { NextRequest, NextResponse } from "next/server";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import {
  clearLoginAttempts,
  getClientIdentifier,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/server/admin-login-throttle";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { createSupabaseRouteClient, jsonWithForwardedCookies } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    await addAdminAuditEvent({
      action: "admin_login",
      status: "failed",
      meta: { reason: "invalid_origin" },
    });
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const clientId = getClientIdentifier(request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"));
  const throttle = isLoginBlocked(clientId);
  if (throttle.blocked) {
    await addAdminAuditEvent({
      action: "admin_login",
      status: "failed",
      meta: { reason: "throttled", retryAfter: throttle.retryAfterSeconds },
    });
    return NextResponse.json(
      { ok: false, error: "too_many_attempts", retryAfter: throttle.retryAfterSeconds },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const cookieCarrier = NextResponse.next();
  let supabase: ReturnType<typeof createSupabaseRouteClient>;
  try {
    supabase = createSupabaseRouteClient(request, cookieCarrier);
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_config_invalid" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    recordFailedLogin(clientId);
    await addAdminAuditEvent({
      action: "admin_login",
      status: "failed",
      meta: { reason: "invalid_credentials" },
    });
    return jsonWithForwardedCookies(
      cookieCarrier,
      { ok: false, error: "invalid-credentials" },
      401,
    );
  }

  const { data: adminRow, error: adminError } = (await supabase
    .from("admin_users")
    .select("role, enabled")
    .eq("user_id", data.user.id)
    .eq("enabled", true)
    .maybeSingle()) as { data: { role?: string } | null; error: { message: string } | null };

  if (adminError || !adminRow || adminRow.role !== "admin") {
    await supabase.auth.signOut();
    recordFailedLogin(clientId);
    await addAdminAuditEvent({
      action: "admin_login",
      status: "failed",
      meta: { reason: "not_admin", email: data.user.email ?? null },
    });
    return jsonWithForwardedCookies(cookieCarrier, { ok: false, error: "forbidden" }, 403);
  }

  clearLoginAttempts(clientId);
  await addAdminAuditEvent({
    action: "admin_login",
    status: "success",
    meta: { email: data.user.email ?? null },
  });

  return jsonWithForwardedCookies(cookieCarrier, { ok: true }, 200);
}
