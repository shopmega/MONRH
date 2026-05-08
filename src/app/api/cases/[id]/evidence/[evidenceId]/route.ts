import { NextRequest, NextResponse } from "next/server";
import { getCaseById, removeExternalEvidenceFromCase } from "@/lib/server/app-store";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getCurrentUserId } from "@/lib/server/user-session";
import { updateUploadedCaseEvidenceArtifactStatus } from "@/lib/server/verification-store";

const DEFAULT_CASE_EVIDENCE_BUCKET = "case-evidence";

function findEvidenceEntry(
  timeline: Record<string, unknown>,
  evidenceId: string,
): Record<string, unknown> | null {
  const activeList = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];
  const archivedList = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  const match = [...activeList, ...archivedList].find((item) => {
    if (!item || typeof item !== "object") return false;
    return String((item as Record<string, unknown>).id ?? "") === evidenceId;
  });

  return match && typeof match === "object" ? (match as Record<string, unknown>) : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id, evidenceId } = await context.params;
  const item = await getCaseById(id, userId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const evidence = findEvidenceEntry(item.timeline, evidenceId);
  if (!evidence) {
    return NextResponse.json({ ok: false, error: "evidence_not_found" }, { status: 404 });
  }
  const config = await readAdminConfig();
  const activeList = Array.isArray(item.timeline.externalEvidence) ? item.timeline.externalEvidence : [];
  const isArchived = !activeList.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return String((entry as Record<string, unknown>).id ?? "") === evidenceId;
  });

  if (isArchived && !config.evidenceGovernance.allowArchivedEvidenceDownload) {
    return NextResponse.json({ ok: false, error: "archived_evidence_download_disabled" }, { status: 403 });
  }

  const storagePath = typeof evidence.storagePath === "string" ? evidence.storagePath : "";
  const bucket =
    typeof evidence.bucket === "string" && evidence.bucket.trim().length > 0
      ? evidence.bucket
      : DEFAULT_CASE_EVIDENCE_BUCKET;

  if (storagePath) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, config.evidenceGovernance.signedUrlTtlSeconds);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ ok: false, error: error?.message ?? "signed_url_failed" }, { status: 400 });
    }

    return NextResponse.redirect(data.signedUrl);
  }

  const publicUrl = typeof evidence.publicUrl === "string" ? evidence.publicUrl : "";
  if (publicUrl) {
    return NextResponse.redirect(publicUrl);
  }

  return NextResponse.json({ ok: false, error: "file_unavailable" }, { status: 404 });
}

export async function DELETE(
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

  const { id, evidenceId } = await context.params;
  const item = await getCaseById(id, userId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const evidence = findEvidenceEntry(item.timeline, evidenceId);
  if (!evidence) {
    return NextResponse.json({ ok: false, error: "evidence_not_found" }, { status: 404 });
  }

  const nextItem = await removeExternalEvidenceFromCase({ caseId: id, evidenceId }, userId);
  try {
    await updateUploadedCaseEvidenceArtifactStatus({
      evidenceId,
      status: "archived",
    });
  } catch (artifactError) {
    console.error("[cases.evidence] archive artifact sync failed", artifactError);
  }
  await addAdminAuditEvent({
    action: "case_evidence_archive",
    status: "success",
    meta: {
      caseId: id,
      evidenceId,
      label: typeof evidence.label === "string" ? evidence.label : "Preuve",
    },
  });
  return NextResponse.json({ ok: true, item: nextItem });
}
