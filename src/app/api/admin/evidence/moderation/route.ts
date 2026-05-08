import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { insertAuditEvent, upsertModerationQueueItem } from "@/lib/server/moderation-queue";
import { updateEvidenceModerationByAdmin } from "@/lib/server/app-store";

type ModerationStatus = "open" | "resolved";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const caseId = typeof payload.caseId === "string" ? payload.caseId.trim() : "";
  const status = payload.status === "resolved" ? "resolved" : "open";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";
  const resolutionReason = typeof payload.resolutionReason === "string" ? payload.resolutionReason.trim() : "";
  const assigneeEmail = typeof payload.assigneeEmail === "string" ? payload.assigneeEmail.trim() : "";
  const needsFollowUp = payload.needsFollowUp === true;

  if (!caseId) {
    return NextResponse.json({ ok: false, error: "missing_case_id" }, { status: 400 });
  }

  try {
    const item = await updateEvidenceModerationByAdmin({
      caseId,
      status: status as ModerationStatus,
      note,
      resolutionReason,
      needsFollowUp,
      assigneeEmail,
      reviewerId: adminUser.id,
      reviewerEmail: adminUser.email ?? undefined,
    });

    const queueId = await upsertModerationQueueItem({
      entityType: "case_evidence",
      entityId: caseId,
      companyId: item.companyId,
      status: status === "resolved" ? "resolved" : "open",
      priority: needsFollowUp ? "high" : "normal",
      queueReason: "evidence_moderation",
      latestAction: status === "resolved" ? "evidence_moderation_resolved" : "evidence_moderation_open",
      assignedAdminId: assigneeEmail ? adminUser.id : null,
      resolvedByAdminId: status === "resolved" ? adminUser.id : null,
      metadata: {
        moderationStatus: status,
        moderationNote: note || null,
        resolutionReason: resolutionReason || null,
        needsFollowUp,
        assigneeEmail: assigneeEmail || null,
      },
    });

    await insertAuditEvent({
      actorUserId: adminUser.id,
      actorType: "admin",
      action: "admin_case_evidence_moderation",
      entityType: "case_evidence",
      entityId: caseId,
      queueId,
      companyId: item.companyId,
      eventPayload: {
        moderationStatus: status,
        resolutionReason: resolutionReason || null,
        needsFollowUp,
        assigneeEmail: assigneeEmail || null,
        reviewerEmail: adminUser.email ?? null,
      },
    });

    await addAdminAuditEvent({
      action: "admin_case_evidence_moderation",
      status: "success",
      meta: {
        caseId,
        moderationStatus: status,
        resolutionReason: resolutionReason || null,
        needsFollowUp,
        assigneeEmail: assigneeEmail || null,
        reviewerId: adminUser.id,
        reviewerEmail: adminUser.email ?? null,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    await insertAuditEvent({
      actorUserId: adminUser.id,
      actorType: "admin",
      action: "admin_case_evidence_moderation_failed",
      entityType: "case_evidence",
      entityId: caseId,
      eventPayload: {
        moderationStatus: status,
        resolutionReason: resolutionReason || null,
        needsFollowUp,
        assigneeEmail: assigneeEmail || null,
        reviewerEmail: adminUser.email ?? null,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    await addAdminAuditEvent({
      action: "admin_case_evidence_moderation",
      status: "failed",
      meta: {
        caseId,
        moderationStatus: status,
        resolutionReason: resolutionReason || null,
        needsFollowUp,
        assigneeEmail: assigneeEmail || null,
        reviewerId: adminUser.id,
        reviewerEmail: adminUser.email ?? null,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "case_evidence_moderation_update_failed",
      },
      { status: 400 },
    );
  }
}
