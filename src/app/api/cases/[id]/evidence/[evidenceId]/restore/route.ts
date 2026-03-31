import { NextRequest, NextResponse } from "next/server";
import { restoreExternalEvidenceToCase } from "@/lib/server/app-store";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { getCurrentUserId } from "@/lib/server/user-session";
import { updateUploadedCaseEvidenceArtifactStatus } from "@/lib/server/verification-store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; evidenceId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id, evidenceId } = await context.params;
    const item = await restoreExternalEvidenceToCase({ caseId: id, evidenceId }, userId);
    const restoredEvidence = Array.isArray(item.timeline.externalEvidence)
      ? item.timeline.externalEvidence.find((entry) => {
          if (!entry || typeof entry !== "object") return false;
          return String((entry as Record<string, unknown>).id ?? "") === evidenceId;
        })
      : null;
    try {
      await updateUploadedCaseEvidenceArtifactStatus({
        evidenceId,
        status:
          restoredEvidence &&
          typeof restoredEvidence === "object" &&
          (restoredEvidence as Record<string, unknown>).status === "ready"
            ? "ready"
            : "available",
      });
    } catch (artifactError) {
      console.error("[cases.evidence.restore] artifact sync failed", artifactError);
    }
    await addAdminAuditEvent({
      action: "case_evidence_restore",
      status: "success",
      meta: {
        caseId: id,
        evidenceId,
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    await addAdminAuditEvent({
      action: "case_evidence_restore",
      status: "failed",
      meta: {
        error: error instanceof Error ? error.message : "evidence_restore_failed",
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "evidence_restore_failed",
      },
      { status: 400 },
    );
  }
}
