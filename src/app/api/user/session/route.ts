import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/server/csrf";
import {
  clearLoginAttempts,
  getClientIdentifier,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/server/user-login-throttle";
import {
  createSupabaseRouteClient,
  createSupabaseServerClient,
  jsonWithForwardedCookies,
} from "@/lib/supabase/server";

type SessionPayload = {
  email?: string;
  password?: string;
  mode?: "signin" | "signup";
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return NextResponse.json({ ok: true, authenticated: false });
    }
    return NextResponse.json({
      ok: true,
      authenticated: Boolean(data.user),
      user: data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_config_invalid" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const clientId = getClientIdentifier(
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
  );
  const throttle = isLoginBlocked(clientId);
  if (throttle.blocked) {
    return NextResponse.json(
      { ok: false, error: "too_many_attempts", retryAfter: throttle.retryAfterSeconds },
      { status: 429 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as SessionPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const mode = payload.mode === "signup" ? "signup" : "signin";

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

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=/compte`,
      },
    });

    if (error) {
      recordFailedLogin(clientId);
      return jsonWithForwardedCookies(cookieCarrier, { ok: false, error: error.message }, 400);
    }

    clearLoginAttempts(clientId);
    const requiresEmailConfirmation = Boolean(data.user) && !data.session;
    return jsonWithForwardedCookies(
      cookieCarrier,
      {
        ok: true,
        authenticated: Boolean(data.session),
        mode,
        requiresEmailConfirmation,
      },
      200,
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    recordFailedLogin(clientId);
    return jsonWithForwardedCookies(cookieCarrier, { ok: false, error: "invalid_credentials" }, 401);
  }

  clearLoginAttempts(clientId);
  return jsonWithForwardedCookies(
    cookieCarrier,
    {
      ok: true,
      authenticated: true,
      mode,
      user: { id: data.user.id, email: data.user.email ?? null },
    },
    200,
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const cookieCarrier = NextResponse.next();
  try {
    const supabase = createSupabaseRouteClient(request, cookieCarrier);
    await supabase.auth.signOut();
    return jsonWithForwardedCookies(cookieCarrier, { ok: true, authenticated: false }, 200);
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_config_invalid" }, { status: 503 });
  }
}
