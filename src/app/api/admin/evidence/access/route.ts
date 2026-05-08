import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { listCases } from "@/lib/server/app-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

const DEFAULT_CASE_EVIDENCE_BUCKET = "case-evidence";

function findEvidenceEntry(
  timeline: Record<string, unknown>,
  evidenceId: string,
): Record<string, unknown> | null {
  const active = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];
  const archived = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  const match = [...active, ...archived].find((item) => {
    if (!item || typeof item !== "object") return false;
    return String((item as Record<string, unknown>).id ?? "") === evidenceId;
  });

  return match && typeof match === "object" ? (match as Record<string, unknown>) : null;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const caseId = request.nextUrl.searchParams.get("caseId")?.trim() ?? "";
  const evidenceId = request.nextUrl.searchParams.get("evidenceId")?.trim() ?? "";
  if (!caseId || !evidenceId) {
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
  }

  const cases = await listCases();
  const item = cases.find((entry) => entry.id === caseId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
  }

  const evidence = findEvidenceEntry(item.timeline, evidenceId);
  if (!evidence) {
    return NextResponse.json({ ok: false, error: "evidence_not_found" }, { status: 404 });
  }

  const storagePath = typeof evidence.storagePath === "string" ? evidence.storagePath : "";
  const bucket =
    typeof evidence.bucket === "string" && evidence.bucket.trim().length > 0
      ? evidence.bucket
      : DEFAULT_CASE_EVIDENCE_BUCKET;

  try {
    if (storagePath) {
      const config = await readAdminConfig();
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, config.evidenceGovernance.signedUrlTtlSeconds);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message ?? "signed_url_failed");
      }

      await addAdminAuditEvent({
        action: "admin_case_evidence_access",
        status: "success",
        meta: { caseId, evidenceId, bucket },
      });

      return NextResponse.redirect(data.signedUrl);
    }

    const publicUrl = typeof evidence.publicUrl === "string" ? evidence.publicUrl : "";
    if (publicUrl) {
      await addAdminAuditEvent({
        action: "admin_case_evidence_access",
        status: "success",
        meta: { caseId, evidenceId, mode: "public_url_fallback" },
      });

      return NextResponse.redirect(publicUrl);
    }

    return NextResponse.json({ ok: false, error: "file_unavailable" }, { status: 404 });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_case_evidence_access",
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
        error: error instanceof Error ? error.message : "admin_case_evidence_access_failed",
      },
      { status: 400 },
    );
  }
}
