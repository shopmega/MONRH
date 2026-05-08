import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { insertAuditEvent, upsertModerationQueueItem } from "@/lib/server/moderation-queue";
import { decideEmploymentVerificationByAdmin } from "@/lib/server/verification-store";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "needs_more_info"]),
  note: z.string().max(2000).optional(),
  evidenceArtifactId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const payload = await request.json();
    const parsed = decisionSchema.parse(payload);
    const item = await decideEmploymentVerificationByAdmin({
      verificationId: id,
      decision: parsed.decision,
      note: parsed.note,
      evidenceArtifactId: parsed.evidenceArtifactId,
      deciderUserId: adminUser.id,
    });

    const queueId = await upsertModerationQueueItem({
      entityType: "employment_verification",
      entityId: id,
      companyId: item.companyId,
      userId: item.userId,
      status:
        parsed.decision === "approved"
          ? "resolved"
          : parsed.decision === "rejected"
            ? "dismissed"
            : "in_review",
      priority: parsed.decision === "needs_more_info" ? "high" : "normal",
      queueReason: "employment_verification_review",
      latestAction: `verification_${parsed.decision}`,
      resolvedByAdminId: parsed.decision === "needs_more_info" ? null : adminUser.id,
      metadata: {
        decision: parsed.decision,
        note: parsed.note ?? null,
        evidenceArtifactId: parsed.evidenceArtifactId ?? null,
        reviewerEmail: adminUser.email ?? null,
      },
    });

    await insertAuditEvent({
      actorUserId: adminUser.id,
      actorType: "admin",
      action: "admin_employment_verification_decision",
      entityType: "employment_verification",
      entityId: id,
      queueId,
      companyId: item.companyId,
      eventPayload: {
        decision: parsed.decision,
        note: parsed.note ?? null,
        evidenceArtifactId: parsed.evidenceArtifactId ?? null,
        reviewerEmail: adminUser.email ?? null,
      },
    });

    await addAdminAuditEvent({
      action: "admin_employment_verification_decision",
      status: "success",
      meta: {
        verificationId: id,
        decision: parsed.decision,
        reviewerId: adminUser.id,
        reviewerEmail: adminUser.email ?? null,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    await insertAuditEvent({
      actorUserId: adminUser.id,
      actorType: "admin",
      action: "admin_employment_verification_decision_failed",
      entityType: "employment_verification",
      entityId: id,
      eventPayload: {
        reviewerEmail: adminUser.email ?? null,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    await addAdminAuditEvent({
      action: "admin_employment_verification_decision",
      status: "failed",
      meta: {
        verificationId: id,
        reviewerId: adminUser.id,
        reviewerEmail: adminUser.email ?? null,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "verification_decision_failed",
      },
      { status: 400 },
    );
  }
}
