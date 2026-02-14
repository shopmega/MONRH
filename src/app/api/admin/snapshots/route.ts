import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import {
  getAdminSnapshotById,
  listAdminSnapshots,
  type AdminSnapshotKind,
} from "@/lib/server/admin-snapshot-store";
import { readAdminConfig, replaceAdminConfig, type AdminConfig } from "@/lib/server/admin-config";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { type LawRulesBundle } from "@/lib/rules/default-rules";
import { writeLawRulesBundle } from "@/lib/server/law-rules-store";

const rollbackSchema = z.object({
  snapshotId: z.string().min(1),
  kind: z.enum(["rules", "config"]),
});

function parseKind(value: string | null): AdminSnapshotKind | undefined {
  if (value === "rules" || value === "config") return value;
  return undefined;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  const snapshots = await listAdminSnapshots(kind);
  return NextResponse.json({ ok: true, snapshots: snapshots.slice(0, 100) });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = rollbackSchema.parse(await request.json());
    const snapshot = await getAdminSnapshotById(payload.snapshotId);
    if (!snapshot || snapshot.kind !== payload.kind) {
      return NextResponse.json({ ok: false, error: "snapshot_not_found" }, { status: 404 });
    }

    if (snapshot.kind === "config") {
      const configPayload = snapshot.payload as AdminConfig;
      const current = await readAdminConfig();
      const config = await replaceAdminConfig({
        simulatorAdStepEnabled:
          configPayload.simulatorAdStepEnabled ?? current.simulatorAdStepEnabled,
        documentAdStepEnabled:
          configPayload.documentAdStepEnabled ?? current.documentAdStepEnabled,
        maintenanceMessage: configPayload.maintenanceMessage ?? current.maintenanceMessage,
        websiteSettings: configPayload.websiteSettings ?? current.websiteSettings,
        toolPolicies: configPayload.toolPolicies ?? current.toolPolicies,
      });
      await addAdminAuditEvent({
        action: "admin_snapshot_restore_config",
        status: "success",
        meta: { snapshotId: snapshot.id },
      });
      return NextResponse.json({ ok: true, config });
    }

    const rulesPayload = snapshot.payload as LawRulesBundle;
    const rules = await writeLawRulesBundle(rulesPayload);
    await addAdminAuditEvent({
      action: "admin_snapshot_restore_rules",
      status: "success",
      meta: { snapshotId: snapshot.id },
    });
    return NextResponse.json({ ok: true, rules });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_snapshot_restore",
      status: "failed",
      meta: {
        error: error instanceof Error ? error.message : "invalid_payload",
      },
    });
    return NextResponse.json({ ok: false, error: "restore_failed" }, { status: 400 });
  }
}
