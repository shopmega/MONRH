/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type LinkedCompanyInput = {
  fieldId: string;
  companyId: string;
  companyName: string;
  slug?: string | null;
};

export type EvidenceArtifactRecord = {
  id: string;
  userId: string;
  artifactType: string;
  status: string;
  title: string;
  description: string | null;
  companyId: string | null;
  companyName: string | null;
  documentId: string | null;
  caseId: string | null;
  createdAt: string;
};

export type EmploymentVerificationRecord = {
  id: string;
  userId: string;
  companyId: string;
  companyName: string | null;
  status: string;
  sourceType: string;
  sourceDocumentId: string | null;
  sourceCaseId: string | null;
  evidenceArtifactId: string | null;
  createdAt: string;
};

export type VerificationQueryOptions = {
  verificationId?: string;
  caseId?: string;
  companyId?: string;
  status?: string;
  limit?: number;
};

export type EvidenceArtifactQueryOptions = {
  caseId?: string;
  companyId?: string;
  documentId?: string;
  limit?: number;
};

export type VerificationDecisionRecord = {
  id: string;
  verificationId: string;
  deciderUserId: string | null;
  decision: string;
  note: string | null;
  evidenceArtifactId: string | null;
  createdAt: string;
};

export type AdminEmploymentVerificationRecord = EmploymentVerificationRecord & {
  latestDecision: VerificationDecisionRecord | null;
};

export type CompanyVerificationSignals = {
  companyId: string;
  totals: {
    pending: number;
    verified: number;
    rejected: number;
    needsMoreInfo: number;
    total: number;
  };
  verifiedRatio: number;
  decisionRate: number;
  latestActivityAt: string | null;
  latestDecisionAt: string | null;
  latestQueueActivityAt: string | null;
  evidenceArtifactCount: number;
  evidenceAvailableCount: number;
  queueTotals: {
    open: number;
    inReview: number;
    resolved: number;
    dismissed: number;
    total: number;
    critical: number;
  };
  sourceTypes: Array<{
    sourceType: string;
    count: number;
  }>;
};

function mapEvidenceArtifact(row: Record<string, unknown>): EvidenceArtifactRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    artifactType: String(row.artifact_type),
    status: String(row.status),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    documentId: row.document_id ? String(row.document_id) : null,
    caseId: row.case_id ? String(row.case_id) : null,
    createdAt: String(row.created_at),
  };
}

function mapEmploymentVerification(row: Record<string, unknown>): EmploymentVerificationRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    companyId: String(row.company_id),
    companyName: row.company_name ? String(row.company_name) : null,
    status: String(row.status),
    sourceType: String(row.source_type),
    sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
    sourceCaseId: row.source_case_id ? String(row.source_case_id) : null,
    evidenceArtifactId: row.evidence_artifact_id ? String(row.evidence_artifact_id) : null,
    createdAt: String(row.created_at),
  };
}

function mapVerificationDecision(row: Record<string, unknown>): VerificationDecisionRecord {
  return {
    id: String(row.id),
    verificationId: String(row.verification_id),
    deciderUserId: row.decider_user_id ? String(row.decider_user_id) : null,
    decision: String(row.decision),
    note: row.note ? String(row.note) : null,
    evidenceArtifactId: row.evidence_artifact_id ? String(row.evidence_artifact_id) : null,
    createdAt: String(row.created_at),
  };
}

async function insertEvidenceLinks(
  links: Array<{
    evidence_artifact_id: string;
    entity_type: string;
    entity_id: string;
    relationship: string;
  }>,
) {
  if (links.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient() as any;
  const { error } = await supabase.from("evidence_links").insert(links);
  if (error) {
    throw new Error(error.message ?? "evidence_links_insert_failed");
  }
}

async function listEvidenceArtifactIdsForCaseEvidenceEntry(evidenceId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("evidence_links")
    .select("evidence_artifact_id")
    .eq("entity_type", "case_evidence_entry")
    .eq("entity_id", evidenceId);

  if (error) {
    throw new Error(error.message ?? "case_evidence_link_lookup_failed");
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => String(row.evidence_artifact_id ?? ""))
    .filter((value) => value.length > 0);
}

export async function registerGeneratedDocumentEvidence(params: {
  userId: string;
  document: {
    id: string;
    createdAt: string;
    templateId: string;
    templateTitle: string;
  };
  caseId?: string;
  linkedCompanies: LinkedCompanyInput[];
}): Promise<{
  evidenceArtifacts: EvidenceArtifactRecord[];
  verifications: EmploymentVerificationRecord[];
}> {
  const supabase = getSupabaseAdminClient() as any;
  const scopedCompanies = params.linkedCompanies.length > 0 ? params.linkedCompanies : [null];

  const evidenceInserts = scopedCompanies.map((company) => ({
    user_id: params.userId,
    artifact_type: "generated_document",
    status: "available",
    title: params.document.templateTitle,
    description:
      company ?
        `Document genere rattache a ${company.companyName} depuis le modele ${params.document.templateId}.`
      : `Document genere depuis le modele ${params.document.templateId}.`,
    company_id: company?.companyId ?? null,
    company_name: company?.companyName ?? null,
    document_id: params.document.id,
    case_id: params.caseId ?? null,
    artifact_payload: {
      sourceType: "generated_document",
      templateId: params.document.templateId,
      templateTitle: params.document.templateTitle,
      sourceDocumentCreatedAt: params.document.createdAt,
      companyFieldId: company?.fieldId ?? null,
      companySlug: company?.slug ?? null,
    },
  }));

  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("evidence_artifacts")
    .insert(evidenceInserts)
    .select("id, user_id, artifact_type, status, title, description, company_id, company_name, document_id, case_id, created_at");

  if (evidenceError || !evidenceRows) {
    throw new Error(evidenceError?.message ?? "evidence_artifact_insert_failed");
  }

  const evidenceArtifacts = (evidenceRows as Array<Record<string, unknown>>).map(mapEvidenceArtifact);
  const evidenceByCompanyId = new Map(
    evidenceArtifacts.filter((item) => item.companyId).map((item) => [item.companyId as string, item]),
  );

  let verifications: EmploymentVerificationRecord[] = [];
  if (params.linkedCompanies.length > 0) {
    const verificationInserts = params.linkedCompanies.map((company) => ({
      user_id: params.userId,
      company_id: company.companyId,
      company_name: company.companyName,
      status: "pending",
      source_type: "generated_document",
      source_document_id: params.document.id,
      source_case_id: params.caseId ?? null,
      evidence_artifact_id: evidenceByCompanyId.get(company.companyId)?.id ?? null,
      verification_context: {
        templateId: params.document.templateId,
        templateTitle: params.document.templateTitle,
        companyFieldId: company.fieldId,
        companySlug: company.slug ?? null,
      },
    }));

    const { data: verificationRows, error: verificationError } = await supabase
      .from("employment_verifications")
      .insert(verificationInserts)
      .select("id, user_id, company_id, company_name, status, source_type, source_document_id, source_case_id, evidence_artifact_id, created_at");

    if (verificationError || !verificationRows) {
      throw new Error(verificationError?.message ?? "employment_verification_insert_failed");
    }

    verifications = (verificationRows as Array<Record<string, unknown>>).map(mapEmploymentVerification);
  }

  const evidenceLinks = evidenceArtifacts.flatMap((artifact) => [
    {
      evidence_artifact_id: artifact.id,
      entity_type: "document",
      entity_id: params.document.id,
      relationship: "derived_from",
    },
    ...(artifact.caseId
      ? [
          {
            evidence_artifact_id: artifact.id,
            entity_type: "case",
            entity_id: artifact.caseId,
            relationship: "supports",
          },
        ]
      : []),
    ...(artifact.companyId
      ? [
          {
            evidence_artifact_id: artifact.id,
            entity_type: "company",
            entity_id: artifact.companyId,
            relationship: "supports",
          },
        ]
      : []),
  ]);

  await insertEvidenceLinks(evidenceLinks);

  return {
    evidenceArtifacts,
    verifications,
  };
}

export async function registerUploadedCaseEvidence(params: {
  userId: string;
  caseId: string;
  companyId?: string | null;
  companyName?: string | null;
  evidence: {
    id: string;
    label: string;
    evidenceType: string;
    note?: string;
    status: "available" | "ready";
    createdAt: string;
    observedAt?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    bucket?: string;
    storagePath?: string;
  };
}): Promise<EvidenceArtifactRecord> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("evidence_artifacts")
    .insert({
      user_id: params.userId,
      artifact_type: "external_upload",
      status: params.evidence.status,
      title: params.evidence.label,
      description:
        params.evidence.note?.trim() ||
        `Preuve televersee dans le dossier ${params.caseId} (${params.evidence.evidenceType}).`,
      company_id: params.companyId ?? null,
      company_name: params.companyName ?? null,
      case_id: params.caseId,
      storage_bucket: params.evidence.bucket ?? null,
      storage_path: params.evidence.storagePath ?? null,
      artifact_payload: {
        sourceType: "external_case_evidence",
        sourceEvidenceId: params.evidence.id,
        evidenceType: params.evidence.evidenceType,
        observedAt: params.evidence.observedAt ?? null,
        fileName: params.evidence.fileName ?? null,
        mimeType: params.evidence.mimeType ?? null,
        fileSize: params.evidence.fileSize ?? null,
      },
    })
    .select("id, user_id, artifact_type, status, title, description, company_id, company_name, document_id, case_id, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "case_evidence_artifact_insert_failed");
  }

  const artifact = mapEvidenceArtifact(data as Record<string, unknown>);
  await insertEvidenceLinks([
    {
      evidence_artifact_id: artifact.id,
      entity_type: "case",
      entity_id: params.caseId,
      relationship: "supports",
    },
    {
      evidence_artifact_id: artifact.id,
      entity_type: "case_evidence_entry",
      entity_id: params.evidence.id,
      relationship: "mirrors",
    },
    ...(params.companyId
      ? [
          {
            evidence_artifact_id: artifact.id,
            entity_type: "company",
            entity_id: params.companyId,
            relationship: "supports",
          },
        ]
      : []),
  ]);

  return artifact;
}

export async function updateUploadedCaseEvidenceArtifactStatus(params: {
  evidenceId: string;
  status: "available" | "ready" | "archived" | "purged";
  storageBucket?: string | null;
  storagePath?: string | null;
}) {
  const artifactIds = await listEvidenceArtifactIdsForCaseEvidenceEntry(params.evidenceId);
  if (artifactIds.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient() as any;
  const updates: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.status === "purged") {
    updates.storage_bucket = params.storageBucket ?? null;
    updates.storage_path = params.storagePath ?? null;
  }

  const { error } = await supabase
    .from("evidence_artifacts")
    .update(updates)
    .in("id", artifactIds);

  if (error) {
    throw new Error(error.message ?? "case_evidence_artifact_status_update_failed");
  }
}

export async function listEmploymentVerifications(
  userId: string,
  options: VerificationQueryOptions = {},
): Promise<EmploymentVerificationRecord[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("employment_verifications")
    .select("id, user_id, company_id, company_name, status, source_type, source_document_id, source_case_id, evidence_artifact_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.caseId) {
    query = query.eq("source_case_id", options.caseId);
  }
  if (options.verificationId) {
    query = query.eq("id", options.verificationId);
  }
  if (options.companyId) {
    query = query.eq("company_id", options.companyId);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message ?? "employment_verification_list_failed");
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapEmploymentVerification);
}

export async function listEvidenceArtifacts(
  userId: string,
  options: EvidenceArtifactQueryOptions = {},
): Promise<EvidenceArtifactRecord[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("evidence_artifacts")
    .select("id, user_id, artifact_type, status, title, description, company_id, company_name, document_id, case_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.caseId) {
    query = query.eq("case_id", options.caseId);
  }
  if (options.companyId) {
    query = query.eq("company_id", options.companyId);
  }
  if (options.documentId) {
    query = query.eq("document_id", options.documentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message ?? "evidence_artifact_list_failed");
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapEvidenceArtifact);
}

export async function listEmploymentVerificationsAdmin(
  options: VerificationQueryOptions = {},
): Promise<AdminEmploymentVerificationRecord[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("employment_verifications")
    .select("id, user_id, company_id, company_name, status, source_type, source_document_id, source_case_id, evidence_artifact_id, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 200);

  if (options.caseId) {
    query = query.eq("source_case_id", options.caseId);
  }
  if (options.verificationId) {
    query = query.eq("id", options.verificationId);
  }
  if (options.companyId) {
    query = query.eq("company_id", options.companyId);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message ?? "employment_verification_admin_list_failed");
  }

  const verifications = ((data ?? []) as Array<Record<string, unknown>>).map(mapEmploymentVerification);
  if (verifications.length === 0) {
    return [];
  }

  const verificationIds = verifications.map((item) => item.id);
  const { data: decisionRows, error: decisionsError } = await supabase
    .from("verification_decisions")
    .select("id, verification_id, decider_user_id, decision, note, evidence_artifact_id, created_at")
    .in("verification_id", verificationIds)
    .order("created_at", { ascending: false });

  if (decisionsError) {
    throw new Error(decisionsError.message ?? "verification_decision_list_failed");
  }

  const latestDecisionByVerificationId = new Map<string, VerificationDecisionRecord>();
  for (const row of (decisionRows ?? []) as Array<Record<string, unknown>>) {
    const decision = mapVerificationDecision(row);
    if (!latestDecisionByVerificationId.has(decision.verificationId)) {
      latestDecisionByVerificationId.set(decision.verificationId, decision);
    }
  }

  return verifications.map((item) => ({
    ...item,
    latestDecision: latestDecisionByVerificationId.get(item.id) ?? null,
  }));
}

export async function decideEmploymentVerificationByAdmin(params: {
  verificationId: string;
  decision: "approved" | "rejected" | "needs_more_info";
  note?: string;
  deciderUserId?: string;
  evidenceArtifactId?: string;
}): Promise<AdminEmploymentVerificationRecord> {
  const supabase = getSupabaseAdminClient() as any;
  const nextStatus =
    params.decision === "approved"
      ? "verified"
      : params.decision === "rejected"
        ? "rejected"
        : "needs_more_info";

  const note = params.note?.trim();

  const { error: insertError } = await supabase.from("verification_decisions").insert({
    verification_id: params.verificationId,
    decider_user_id: params.deciderUserId ?? null,
    decision: params.decision,
    note: note || null,
    evidence_artifact_id: params.evidenceArtifactId ?? null,
  });

  if (insertError) {
    throw new Error(insertError.message ?? "verification_decision_insert_failed");
  }

  const { error: updateError } = await supabase
    .from("employment_verifications")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      evidence_artifact_id: params.evidenceArtifactId ?? null,
    })
    .eq("id", params.verificationId);

  if (updateError) {
    throw new Error(updateError.message ?? "employment_verification_update_failed");
  }

  const items = await listEmploymentVerificationsAdmin({
    verificationId: params.verificationId,
    limit: 1,
  });
  const match = items[0];
  if (!match) {
    throw new Error("employment_verification_not_found");
  }

  return match;
}

export async function getCompanyVerificationSignals(companyId: string): Promise<CompanyVerificationSignals> {
  const supabase = getSupabaseAdminClient() as any;
  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      companyId: "",
      totals: {
        pending: 0,
        verified: 0,
        rejected: 0,
        needsMoreInfo: 0,
        total: 0,
      },
      verifiedRatio: 0,
      decisionRate: 0,
      latestActivityAt: null,
      latestDecisionAt: null,
      latestQueueActivityAt: null,
      evidenceArtifactCount: 0,
      evidenceAvailableCount: 0,
      queueTotals: {
        open: 0,
        inReview: 0,
        resolved: 0,
        dismissed: 0,
        total: 0,
        critical: 0,
      },
      sourceTypes: [],
    };
  }

  const [
    { data, error },
    { data: evidenceRows, error: evidenceError },
    { data: queueRows, error: queueError },
  ] = await Promise.all([
    supabase
      .from("employment_verifications")
      .select("id, status, source_type, created_at, updated_at")
      .eq("company_id", resolvedCompanyId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("evidence_artifacts")
      .select("id, status, created_at")
      .eq("company_id", resolvedCompanyId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("moderation_queues")
      .select("id, status, priority, created_at, updated_at")
      .eq("company_id", resolvedCompanyId)
      .in("entity_type", ["employment_verification", "case_evidence"])
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (error) {
    throw new Error(error.message ?? "company_verification_signals_failed");
  }
  if (evidenceError) {
    throw new Error(evidenceError.message ?? "company_evidence_signals_failed");
  }
  if (queueError) {
    throw new Error(queueError.message ?? "company_verification_queue_signals_failed");
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const evidenceItems = (evidenceRows ?? []) as Array<Record<string, unknown>>;
  const queueItems = (queueRows ?? []) as Array<Record<string, unknown>>;
  const totals = {
    pending: 0,
    verified: 0,
    rejected: 0,
    needsMoreInfo: 0,
    total: rows.length,
  };
  const sourceCounts = new Map<string, number>();
  let latestActivityAt: string | null = null;

  for (const row of rows) {
    const status = String(row.status ?? "pending");
    if (status === "verified") totals.verified += 1;
    else if (status === "rejected") totals.rejected += 1;
    else if (status === "needs_more_info") totals.needsMoreInfo += 1;
    else totals.pending += 1;

    const sourceType = String(row.source_type ?? "unknown");
    sourceCounts.set(sourceType, (sourceCounts.get(sourceType) ?? 0) + 1);

    const candidateActivityAt =
      typeof row.updated_at === "string" ? row.updated_at : typeof row.created_at === "string" ? row.created_at : null;
    if (candidateActivityAt && (!latestActivityAt || candidateActivityAt > latestActivityAt)) {
      latestActivityAt = candidateActivityAt;
    }
  }

  const queueTotals = {
    open: 0,
    inReview: 0,
    resolved: 0,
    dismissed: 0,
    total: queueItems.length,
    critical: 0,
  };
  let latestQueueActivityAt: string | null = null;

  for (const row of queueItems) {
    const status = String(row.status ?? "open");
    if (status === "resolved") queueTotals.resolved += 1;
    else if (status === "dismissed") queueTotals.dismissed += 1;
    else if (status === "in_review") queueTotals.inReview += 1;
    else queueTotals.open += 1;

    if (String(row.priority ?? "normal") === "critical") {
      queueTotals.critical += 1;
    }

    const candidateQueueActivityAt =
      typeof row.updated_at === "string" ? row.updated_at : typeof row.created_at === "string" ? row.created_at : null;
    if (candidateQueueActivityAt && (!latestQueueActivityAt || candidateQueueActivityAt > latestQueueActivityAt)) {
      latestQueueActivityAt = candidateQueueActivityAt;
    }
  }

  let latestDecisionAt: string | null = null;
  if (rows.length > 0) {
    const verificationIds = rows.map((row) => String(row.id));
    const { data: decisionRows, error: decisionsError } = await supabase
      .from("verification_decisions")
      .select("created_at")
      .in("verification_id", verificationIds)
      .order("created_at", { ascending: false })
      .limit(1);

    if (decisionsError) {
      throw new Error(decisionsError.message ?? "company_verification_decisions_failed");
    }

    const latestDecision = (decisionRows ?? [])[0] as Record<string, unknown> | undefined;
    latestDecisionAt = latestDecision && typeof latestDecision.created_at === "string" ? latestDecision.created_at : null;
  }

  const decidedCount = totals.verified + totals.rejected + totals.needsMoreInfo;
  return {
    companyId: resolvedCompanyId,
    totals,
    verifiedRatio: totals.total > 0 ? totals.verified / totals.total : 0,
    decisionRate: totals.total > 0 ? decidedCount / totals.total : 0,
    latestActivityAt,
    latestDecisionAt,
    latestQueueActivityAt,
    evidenceArtifactCount: evidenceItems.length,
    evidenceAvailableCount: evidenceItems.filter((item) => {
      const status = String(item.status ?? "");
      return status === "available" || status === "ready";
    }).length,
    queueTotals,
    sourceTypes: [...sourceCounts.entries()].map(([sourceType, count]) => ({ sourceType, count })),
  };
}
