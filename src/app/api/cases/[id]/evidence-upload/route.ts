import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { attachExternalEvidenceToCase, getCaseById } from "@/lib/server/app-store";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { insertAuditEvent, upsertModerationQueueItem } from "@/lib/server/moderation-queue";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getCurrentUserId } from "@/lib/server/user-session";
import { registerUploadedCaseEvidence } from "@/lib/server/verification-store";

const CASE_EVIDENCE_BUCKET = "case-evidence";
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extensionFromMimeOrName(type: string, name: string): string {
  if (type === "application/pdf") return "pdf";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "text/plain") return "txt";
  if (type === "application/msword") return "doc";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  const fromName = name.split(".").pop()?.trim().toLowerCase();
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : "bin";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existingCase = await getCaseById(id, userId);
    if (!existingCase) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const label = typeof formData.get("label") === "string" ? String(formData.get("label")).trim() : "";
    const evidenceType =
      typeof formData.get("evidenceType") === "string" ? String(formData.get("evidenceType")).trim() : "other";
    const note = typeof formData.get("note") === "string" ? String(formData.get("note")).trim() : "";
    const observedAt =
      typeof formData.get("observedAt") === "string" ? String(formData.get("observedAt")).trim() : "";
    const statusRaw = typeof formData.get("status") === "string" ? String(formData.get("status")).trim() : "available";
    const status = statusRaw === "ready" ? "ready" : "available";
    const config = await readAdminConfig();
    const maxUploadBytes = config.evidenceGovernance.maxUploadBytes;

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ ok: false, error: "missing_label" }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return NextResponse.json({ ok: false, error: "invalid_file_type" }, { status: 400 });
    }
    if (fileEntry.size > maxUploadBytes) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }

    const ext = extensionFromMimeOrName(fileEntry.type, fileEntry.name);
    const safeName = sanitizeFileName(fileEntry.name.replace(/\.[^.]+$/, "")) || "piece";
    const path = `${userId}/${id}/${Date.now()}-${randomUUID()}-${safeName}.${ext}`;
    const bytes = Buffer.from(await fileEntry.arrayBuffer());

    const supabase = getSupabaseAdminClient();
    const { error: uploadError } = await supabase.storage.from(CASE_EVIDENCE_BUCKET).upload(path, bytes, {
      contentType: fileEntry.type,
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message || "case_evidence_upload_failed");
    }

    const evidenceId = randomUUID();
    const item = await attachExternalEvidenceToCase(
      {
        caseId: id,
        evidence: {
          id: evidenceId,
          label,
          evidenceType,
          note: note || undefined,
          status,
          observedAt: observedAt || undefined,
          createdAt: new Date().toISOString(),
          fileName: fileEntry.name,
          mimeType: fileEntry.type,
          fileSize: fileEntry.size,
          bucket: CASE_EVIDENCE_BUCKET,
          storagePath: path,
        },
      },
      userId,
    );

    let structuredEvidenceId: string | null = null;
    let queueId: string | null = null;
    let sharedEvidenceSynced = true;

    try {
      const artifact = await registerUploadedCaseEvidence({
        userId,
        caseId: id,
        companyId: item.companyId,
        companyName: item.companyName,
        evidence: {
          id: evidenceId,
          label,
          evidenceType,
          note: note || undefined,
          status,
          observedAt: observedAt || undefined,
          createdAt: new Date().toISOString(),
          fileName: fileEntry.name,
          mimeType: fileEntry.type,
          fileSize: fileEntry.size,
          bucket: CASE_EVIDENCE_BUCKET,
          storagePath: path,
        },
      });
      structuredEvidenceId = artifact.id;

      queueId = await upsertModerationQueueItem({
        entityType: "case_evidence",
        entityId: id,
        companyId: item.companyId,
        userId,
        status: "open",
        priority: status === "ready" ? "high" : "normal",
        queueReason: "evidence_moderation",
        latestAction: "case_evidence_uploaded",
        metadata: {
          lastEvidenceId: evidenceId,
          lastEvidenceArtifactId: structuredEvidenceId,
          lastEvidenceLabel: label,
          lastEvidenceType: evidenceType,
          uploadSource: "user_case_upload",
          storageBucket: CASE_EVIDENCE_BUCKET,
        },
      });

      await insertAuditEvent({
        actorUserId: userId,
        actorType: "user",
        action: "user_case_evidence_upload",
        entityType: "case_evidence",
        entityId: id,
        queueId,
        companyId: item.companyId,
        eventPayload: {
          evidenceId,
          evidenceArtifactId: structuredEvidenceId,
          label,
          evidenceType,
          fileName: fileEntry.name,
          fileSize: fileEntry.size,
        },
      });
    } catch (sharedEvidenceError) {
      sharedEvidenceSynced = false;
      console.error("[cases.evidence-upload] shared evidence sync failed", sharedEvidenceError);
    }

    await addAdminAuditEvent({
      action: "case_evidence_upload",
      status: "success",
      meta: {
        caseId: id,
        evidenceId,
        evidenceLabel: label,
        evidenceType,
        fileName: fileEntry.name,
        fileSize: fileEntry.size,
        bucket: CASE_EVIDENCE_BUCKET,
        sharedEvidenceSynced,
        evidenceArtifactId: structuredEvidenceId,
        moderationQueueId: queueId,
      },
    });

    return NextResponse.json({
      ok: true,
      bucket: CASE_EVIDENCE_BUCKET,
      path,
      evidenceId,
      sharedEvidenceSynced,
      evidenceArtifactId: structuredEvidenceId,
      item,
    });
  } catch (error) {
    await addAdminAuditEvent({
      action: "case_evidence_upload",
      status: "failed",
      meta: {
        error: error instanceof Error ? error.message : "case_evidence_upload_failed",
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "case_evidence_upload_failed",
      },
      { status: 400 },
    );
  }
}
