import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { listCases, purgeArchivedEvidenceFromCaseByAdmin } from "@/lib/server/app-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { updateUploadedCaseEvidenceArtifactStatus } from "@/lib/server/verification-store";

const DEFAULT_CASE_EVIDENCE_BUCKET = "case-evidence";

function findArchivedEvidence(
  timeline: Record<string, unknown>,
  evidenceId: string,
): Record<string, unknown> | null {
  const archived = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  const match = archived.find((item) => {
    if (!item || typeof item !== "object") return false;
    return String((item as Record<string, unknown>).id ?? "") === evidenceId;
  });

  return match && typeof match === "object" ? (match as Record<string, unknown>) : null;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const caseId = request.nextUrl.searchParams.get("caseId")?.trim() ?? "";
  const evidenceId = request.nextUrl.searchParams.get("evidenceId")?.trim() ?? "";
  if (!caseId || !evidenceId) {
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
  }

  try {
    const cases = await listCases();
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) {
      return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
    }

    const evidence = findArchivedEvidence(item.timeline, evidenceId);
    if (!evidence) {
      return NextResponse.json({ ok: false, error: "archived_evidence_not_found" }, { status: 404 });
    }

    const storagePath = typeof evidence.storagePath === "string" ? evidence.storagePath : "";
    const bucket =
      typeof evidence.bucket === "string" && evidence.bucket.trim().length > 0
        ? evidence.bucket
        : DEFAULT_CASE_EVIDENCE_BUCKET;

    if (storagePath) {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.storage.from(bucket).remove([storagePath]);
      if (error) {
        throw new Error(error.message ?? "evidence_storage_remove_failed");
      }
    }

    const nextItem = await purgeArchivedEvidenceFromCaseByAdmin({ caseId, evidenceId });
    try {
      await updateUploadedCaseEvidenceArtifactStatus({
        evidenceId,
        status: "purged",
        storageBucket: null,
        storagePath: null,
      });
    } catch (artifactError) {
      console.error("[admin.evidence.purge] artifact sync failed", artifactError);
    }
    await addAdminAuditEvent({
      action: "admin_case_evidence_purge",
      status: "success",
      meta: {
        caseId,
        evidenceId,
        label: typeof evidence.label === "string" ? evidence.label : "Preuve",
      },
    });

    return NextResponse.json({ ok: true, item: nextItem });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_case_evidence_purge",
      status: "failed",
      meta: {
        caseId,
        evidenceId,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "admin_case_evidence_purge_failed",
      },
      { status: 400 },
    );
  }
}
