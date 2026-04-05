/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import type {
  ArchivedEvidenceEntry,
  EvidenceAuditEvent,
  EvidenceModerationState,
  ExternalEvidenceEntry,
} from "@/lib/cases/timeline";
import { normalizeCaseTimeline } from "@/lib/cases/timeline";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type SavedSimulation = {
  id: string;
  createdAt: string;
  calculatorType: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
};

export type SavedDocument = {
  id: string;
  createdAt: string;
  templateId: string;
  templateTitle: string;
  values: Record<string, string>;
  preview: string;
};

export type SavedCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  caseType: string;
  title: string;
  status: string;
  companyId: string | null;
  companyName: string | null;
  sourceSimulationId: string | null;
  timeline: Record<string, unknown>;
};

function requireUserId(userId: string | undefined) {
  if (!userId || userId.trim().length === 0) {
    throw new Error("user_not_authenticated");
  }
  return userId;
}

function appendEvidenceAuditEvent(
  timeline: Record<string, unknown>,
  event: Omit<EvidenceAuditEvent, "id" | "at"> & { at?: string },
) {
  const existingTrail = Array.isArray(timeline.evidenceAuditTrail) ? timeline.evidenceAuditTrail : [];
  return [
    ...existingTrail,
    {
      id: randomUUID(),
      at: event.at ?? new Date().toISOString(),
      action: event.action,
      evidenceId: event.evidenceId,
      label: event.label,
      note: event.note,
    },
  ];
}

function reopenEvidenceModerationIfNeeded(timeline: Record<string, unknown>) {
  const current = timeline.evidenceModeration;
  if (!current || typeof current !== "object") {
    return undefined;
  }

  const record = current as Record<string, unknown>;
  if (record.status !== "resolved") {
    return current;
  }

  return {
    status: "open" as const,
    note:
      typeof record.note === "string" && record.note.trim().length > 0
        ? record.note
        : "Nouvelle preuve ajoutee apres cloture precedente.",
    needsFollowUp: record.needsFollowUp === true,
    assigneeEmail: typeof record.assigneeEmail === "string" ? record.assigneeEmail : undefined,
    updatedAt: new Date().toISOString(),
    reviewerId: typeof record.reviewerId === "string" ? record.reviewerId : undefined,
    reviewerEmail: typeof record.reviewerEmail === "string" ? record.reviewerEmail : undefined,
  };
}

export async function addSimulation(
  simulation: Omit<SavedSimulation, "id" | "createdAt">,
  userId?: string,
): Promise<SavedSimulation> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_simulations")
    .insert({
      user_id: owner,
      calculator_type: simulation.calculatorType,
      input_payload: simulation.input,
      result_payload: simulation.result,
    })
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "simulation_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  };
}

export async function listSimulations(userId?: string): Promise<SavedSimulation[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_simulations")
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .order("created_at", { ascending: false })
    .limit(500);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.error("[app-store] listSimulations failed:", error?.message ?? "no data");
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  }));
}

export async function getSimulationById(
  simulationId: string,
  userId?: string,
): Promise<SavedSimulation | null> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_simulations")
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .eq("id", simulationId)
    .eq("user_id", owner)
    .maybeSingle();
  if (error) {
    throw new Error(error.message ?? "simulation_get_failed");
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  };
}

export async function addDocument(
  document: Omit<SavedDocument, "id" | "createdAt">,
  userId?: string,
): Promise<SavedDocument> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_documents")
    .insert({
      user_id: owner,
      template_id: document.templateId,
      template_title: document.templateTitle,
      values_payload: document.values,
      preview_text: document.preview,
    })
    .select("id, created_at, template_id, template_title, values_payload, preview_text")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "document_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    templateId: String(row.template_id),
    templateTitle: String(row.template_title),
    values: (row.values_payload as Record<string, string>) ?? {},
    preview: String(row.preview_text ?? ""),
  };
}

export async function listDocuments(userId?: string): Promise<SavedDocument[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_documents")
    .select("id, created_at, template_id, template_title, values_payload, preview_text")
    .order("created_at", { ascending: false })
    .limit(500);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.error("[app-store] listDocuments failed:", error?.message ?? "no data");
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    templateId: String(row.template_id),
    templateTitle: String(row.template_title),
    values: (row.values_payload as Record<string, string>) ?? {},
    preview: String(row.preview_text ?? ""),
  }));
}

export async function addCase(
  item: Omit<SavedCase, "id" | "createdAt" | "updatedAt">,
  userId?: string,
): Promise<SavedCase> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const normalizedTimeline = normalizeCaseTimeline(item.caseType, item.timeline);
  const { data, error } = await supabase
    .from("user_cases")
    .insert({
      user_id: owner,
      case_type: item.caseType,
      title: item.title,
      status: item.status,
      company_id: item.companyId,
      company_name: item.companyName,
      source_simulation_id: item.sourceSimulationId,
      timeline_payload: normalizedTimeline,
    })
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "case_insert_failed");
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    caseType: String(row.case_type),
    title: String(row.title),
    status: String(row.status),
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    sourceSimulationId: row.source_simulation_id ? String(row.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(String(row.case_type), (row.timeline_payload as Record<string, unknown>) ?? {}),
  };
}

export async function listCases(userId?: string): Promise<SavedCase[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_cases")
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .order("created_at", { ascending: false })
    .limit(500);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("[app-store] listCases failed:", error?.message ?? "no data");
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    caseType: String(row.case_type),
    title: String(row.title),
    status: String(row.status),
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    sourceSimulationId: row.source_simulation_id ? String(row.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(String(row.case_type), (row.timeline_payload as Record<string, unknown>) ?? {}),
  }));
}

export async function getCaseById(caseId: string, userId?: string): Promise<SavedCase | null> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_cases")
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .eq("id", caseId)
    .eq("user_id", owner)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    caseType: String(row.case_type),
    title: String(row.title),
    status: String(row.status),
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    sourceSimulationId: row.source_simulation_id ? String(row.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(String(row.case_type), (row.timeline_payload as Record<string, unknown>) ?? {}),
  };
}

export async function updateCase(
  params: {
    caseId: string;
    timeline?: Record<string, unknown>;
  },
  userId?: string,
): Promise<SavedCase> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.timeline) {
    updates.timeline_payload = params.timeline;
  }

  const { data, error } = await supabase
    .from("user_cases")
    .update(updates)
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "case_update_failed");
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    caseType: String(row.case_type),
    title: String(row.title),
    status: String(row.status),
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    sourceSimulationId: row.source_simulation_id ? String(row.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(String(row.case_type), (row.timeline_payload as Record<string, unknown>) ?? {}),
  };
}

export async function attachDocumentToCase(
  params: {
    caseId: string;
    document: Pick<SavedDocument, "id" | "createdAt" | "templateId" | "templateTitle">;
  },
  userId?: string,
): Promise<void> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;

  const { data, error } = await supabase
    .from("user_cases")
    .select("case_type, timeline_payload")
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const caseType = String(row.case_type ?? "");
  const existingDocuments = Array.isArray(timeline.documents) ? timeline.documents : [];

  const nextDocuments = [
    ...existingDocuments.filter((item) => {
      if (!item || typeof item !== "object") return false;
      return String((item as Record<string, unknown>).id ?? "") !== params.document.id;
    }),
    {
      id: params.document.id,
      createdAt: params.document.createdAt,
      templateId: params.document.templateId,
      templateTitle: params.document.templateTitle,
    },
  ];

  const { error: updateError } = await supabase
    .from("user_cases")
    .update({
      timeline_payload: normalizeCaseTimeline(caseType, {
        ...timeline,
        documents: nextDocuments,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.caseId)
    .eq("user_id", owner);

  if (updateError) {
    throw new Error(updateError.message ?? "case_document_attach_failed");
  }
}

export async function attachExternalEvidenceToCase(
  params: {
    caseId: string;
    evidence: ExternalEvidenceEntry;
  },
  userId?: string,
): Promise<SavedCase> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;

  const { data, error } = await supabase
    .from("user_cases")
    .select("case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload, created_at, updated_at")
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const caseType = String(row.case_type ?? "");
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const existingEvidence = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];

  const nextEvidence = [
    ...existingEvidence.filter((item) => {
      if (!item || typeof item !== "object") return false;
      return String((item as Record<string, unknown>).id ?? "") !== params.evidence.id;
    }),
    params.evidence,
  ];

  const normalizedTimeline = normalizeCaseTimeline(caseType, {
    ...timeline,
    externalEvidence: nextEvidence,
    evidenceModeration: reopenEvidenceModerationIfNeeded(timeline),
    evidenceAuditTrail: appendEvidenceAuditEvent(timeline, {
      action: params.evidence.storagePath ? "uploaded" : "added",
      evidenceId: params.evidence.id,
      label: params.evidence.label,
      note: params.evidence.evidenceType,
    }),
  });

  const { data: updated, error: updateError } = await supabase
    .from("user_cases")
    .update({
      timeline_payload: normalizedTimeline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "case_external_evidence_attach_failed");
  }

  const updatedRow = updated as Record<string, unknown>;
  return {
    id: String(updatedRow.id),
    createdAt: String(updatedRow.created_at),
    updatedAt: String(updatedRow.updated_at),
    caseType: String(updatedRow.case_type),
    title: String(updatedRow.title),
    status: String(updatedRow.status),
    companyId: updatedRow.company_id ? String(updatedRow.company_id) : null,
    companyName: updatedRow.company_name ? String(updatedRow.company_name) : null,
    sourceSimulationId: updatedRow.source_simulation_id ? String(updatedRow.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(
      String(updatedRow.case_type),
      (updatedRow.timeline_payload as Record<string, unknown>) ?? {},
    ),
  };
}

export async function removeExternalEvidenceFromCase(
  params: {
    caseId: string;
    evidenceId: string;
  },
  userId?: string,
): Promise<SavedCase> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;

  const { data, error } = await supabase
    .from("user_cases")
    .select("case_type, timeline_payload")
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const caseType = String(row.case_type ?? "");
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const existingEvidence = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];
  const archivedEvidence = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  let archivedEntry: ArchivedEvidenceEntry | null = null;

  const nextEvidence: Array<Record<string, unknown>> = [];
  for (const item of existingEvidence) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const typedItem = item as Record<string, unknown>;
    const evidenceId = String(typedItem.id ?? "");
    if (evidenceId === params.evidenceId) {
      archivedEntry = {
        id: evidenceId,
        label: String(typedItem.label ?? "Preuve"),
        evidenceType: String(typedItem.evidenceType ?? "other"),
        note: typedItem.note ? String(typedItem.note) : undefined,
        status: typedItem.status === "ready" ? "ready" : "available",
        createdAt: typedItem.createdAt ? String(typedItem.createdAt) : undefined,
        observedAt: typedItem.observedAt ? String(typedItem.observedAt) : undefined,
        fileName: typedItem.fileName ? String(typedItem.fileName) : undefined,
        mimeType: typedItem.mimeType ? String(typedItem.mimeType) : undefined,
        fileSize: typeof typedItem.fileSize === "number" ? typedItem.fileSize : undefined,
        bucket: typedItem.bucket ? String(typedItem.bucket) : undefined,
        storagePath: typedItem.storagePath ? String(typedItem.storagePath) : undefined,
        publicUrl: typedItem.publicUrl ? String(typedItem.publicUrl) : undefined,
        archivedAt: new Date().toISOString(),
        archiveReason: "user_archive",
      };
      continue;
    }

    nextEvidence.push(typedItem);
  }

  if (!archivedEntry) {
    throw new Error("evidence_not_found");
  }

  return updateCase(
    {
      caseId: params.caseId,
      timeline: normalizeCaseTimeline(caseType, {
        ...timeline,
        externalEvidence: nextEvidence,
        archivedExternalEvidence: [...archivedEvidence, archivedEntry],
        evidenceAuditTrail: appendEvidenceAuditEvent(timeline, {
          action: "archived",
          evidenceId: archivedEntry.id,
          label: archivedEntry.label,
          note: archivedEntry.archiveReason,
        }),
      }),
    },
    owner,
  );
}

export async function restoreExternalEvidenceToCase(
  params: {
    caseId: string;
    evidenceId: string;
  },
  userId?: string,
): Promise<SavedCase> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;

  const { data, error } = await supabase
    .from("user_cases")
    .select("case_type, timeline_payload")
    .eq("id", params.caseId)
    .eq("user_id", owner)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const caseType = String(row.case_type ?? "");
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const existingEvidence = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];
  const archivedEvidence = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  let restoredEntry: ExternalEvidenceEntry | null = null;

  const nextArchived: Array<Record<string, unknown>> = [];
  for (const item of archivedEvidence) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const typedItem = item as Record<string, unknown>;
    const evidenceId = String(typedItem.id ?? "");
    if (evidenceId === params.evidenceId) {
      restoredEntry = {
        id: evidenceId,
        label: String(typedItem.label ?? "Preuve"),
        evidenceType: String(typedItem.evidenceType ?? "other"),
        note: typedItem.note ? String(typedItem.note) : undefined,
        status: typedItem.status === "ready" ? "ready" : "available",
        createdAt: typedItem.createdAt ? String(typedItem.createdAt) : undefined,
        observedAt: typedItem.observedAt ? String(typedItem.observedAt) : undefined,
        fileName: typedItem.fileName ? String(typedItem.fileName) : undefined,
        mimeType: typedItem.mimeType ? String(typedItem.mimeType) : undefined,
        fileSize: typeof typedItem.fileSize === "number" ? typedItem.fileSize : undefined,
        bucket: typedItem.bucket ? String(typedItem.bucket) : undefined,
        storagePath: typedItem.storagePath ? String(typedItem.storagePath) : undefined,
        publicUrl: typedItem.publicUrl ? String(typedItem.publicUrl) : undefined,
      };
      continue;
    }

    nextArchived.push(typedItem);
  }

  if (!restoredEntry) {
    throw new Error("evidence_not_found");
  }

  return updateCase(
    {
      caseId: params.caseId,
      timeline: normalizeCaseTimeline(caseType, {
        ...timeline,
        externalEvidence: [...existingEvidence, restoredEntry],
        archivedExternalEvidence: nextArchived,
        evidenceModeration: reopenEvidenceModerationIfNeeded(timeline),
        evidenceAuditTrail: appendEvidenceAuditEvent(timeline, {
          action: "restored",
          evidenceId: restoredEntry.id,
          label: restoredEntry.label,
        }),
      }),
    },
    owner,
  );
}

export async function purgeArchivedEvidenceFromCaseByAdmin(params: {
  caseId: string;
  evidenceId: string;
}): Promise<SavedCase> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_cases")
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .eq("id", params.caseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const caseType = String(row.case_type ?? "");
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const archivedEvidence = Array.isArray(timeline.archivedExternalEvidence) ? timeline.archivedExternalEvidence : [];
  let purgedLabel = "Preuve";

  const nextArchivedEvidence = archivedEvidence.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const evidenceId = String((item as Record<string, unknown>).id ?? "");
    if (evidenceId === params.evidenceId) {
      purgedLabel = String((item as Record<string, unknown>).label ?? "Preuve");
    }
    return evidenceId !== params.evidenceId;
  });

  if (nextArchivedEvidence.length === archivedEvidence.length) {
    throw new Error("evidence_not_found");
  }

  const normalizedTimeline = normalizeCaseTimeline(caseType, {
    ...timeline,
    archivedExternalEvidence: nextArchivedEvidence,
    evidenceAuditTrail: appendEvidenceAuditEvent(timeline, {
      action: "purged",
      evidenceId: params.evidenceId,
      label: purgedLabel,
      note: "admin_purge",
    }),
  });

  const { data: updated, error: updateError } = await supabase
    .from("user_cases")
    .update({
      timeline_payload: normalizedTimeline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.caseId)
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "case_evidence_purge_failed");
  }

  const updatedRow = updated as Record<string, unknown>;
  return {
    id: String(updatedRow.id),
    createdAt: String(updatedRow.created_at),
    updatedAt: String(updatedRow.updated_at),
    caseType: String(updatedRow.case_type),
    title: String(updatedRow.title),
    status: String(updatedRow.status),
    companyId: updatedRow.company_id ? String(updatedRow.company_id) : null,
    companyName: updatedRow.company_name ? String(updatedRow.company_name) : null,
    sourceSimulationId: updatedRow.source_simulation_id ? String(updatedRow.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(
      String(updatedRow.case_type),
      (updatedRow.timeline_payload as Record<string, unknown>) ?? {},
    ),
  };
}

export async function updateEvidenceModerationByAdmin(params: {
  caseId: string;
  status: EvidenceModerationState["status"];
  note?: string;
  resolutionReason?: string;
  needsFollowUp?: boolean;
  assigneeEmail?: string;
  reviewerId?: string;
  reviewerEmail?: string;
}): Promise<SavedCase> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_cases")
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .eq("id", params.caseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "case_get_failed");
  }

  if (!data) {
    throw new Error("case_not_found");
  }

  const row = data as Record<string, unknown>;
  const caseType = String(row.case_type ?? "");
  const timeline = (row.timeline_payload as Record<string, unknown>) ?? {};
  const note = params.note?.trim();
  const moderation: EvidenceModerationState = {
    status: params.status === "resolved" ? "resolved" : "open",
    note: note ? note.slice(0, 2000) : undefined,
    resolutionReason: params.resolutionReason?.trim() || undefined,
    needsFollowUp: Boolean(params.needsFollowUp),
    assigneeEmail: params.assigneeEmail?.trim() || undefined,
    updatedAt: new Date().toISOString(),
    reviewerId: params.reviewerId?.trim() || undefined,
    reviewerEmail: params.reviewerEmail?.trim() || undefined,
  };

  const normalizedTimeline = normalizeCaseTimeline(caseType, {
    ...timeline,
    evidenceModeration: moderation,
  });

  const { data: updated, error: updateError } = await supabase
    .from("user_cases")
    .update({
      timeline_payload: normalizedTimeline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.caseId)
    .select("id, created_at, updated_at, case_type, title, status, company_id, company_name, source_simulation_id, timeline_payload")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "case_evidence_moderation_update_failed");
  }

  const updatedRow = updated as Record<string, unknown>;
  return {
    id: String(updatedRow.id),
    createdAt: String(updatedRow.created_at),
    updatedAt: String(updatedRow.updated_at),
    caseType: String(updatedRow.case_type),
    title: String(updatedRow.title),
    status: String(updatedRow.status),
    companyId: updatedRow.company_id ? String(updatedRow.company_id) : null,
    companyName: updatedRow.company_name ? String(updatedRow.company_name) : null,
    sourceSimulationId: updatedRow.source_simulation_id ? String(updatedRow.source_simulation_id) : null,
    timeline: normalizeCaseTimeline(
      String(updatedRow.case_type),
      (updatedRow.timeline_payload as Record<string, unknown>) ?? {},
    ),
  };
}
