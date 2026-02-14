import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { addAdminSnapshot } from "@/lib/server/admin-snapshot-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { readLawRulesBundle, writeLawRulesBundle } from "@/lib/server/law-rules-store";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rules = await readLawRulesBundle();
  return NextResponse.json({ ok: true, rules });
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const current = await readLawRulesBundle();
    await addAdminSnapshot({
      kind: "rules",
      payload: current,
      note: "before_rules_update",
    });

    const payload = await request.json();
    const rules = await writeLawRulesBundle(payload);

    await addAdminAuditEvent({
      action: "admin_rules_update",
      status: "success",
      meta: { salaryVersions: rules.salaryRules.length, terminationVersions: rules.terminationRules.length },
    });

    return NextResponse.json({ ok: true, rules });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_rules_update",
      status: "failed",
      meta: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "invalid_rules_payload", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "failed_to_save_rules" }, { status: 500 });
  }
}
