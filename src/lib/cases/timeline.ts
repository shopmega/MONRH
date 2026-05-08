export type TimelineStep = {
  code?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  documentHref?: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type StepState = {
  done: boolean;
  completedAt?: string;
};

export type TimelineDocument = {
  id?: string;
  createdAt?: string;
  templateId?: string;
  templateTitle?: string;
};

export type CaseEvidenceArtifact = {
  id: string;
  kind: "generated_document" | "checklist_requirement" | "external_evidence";
  status: "available" | "ready" | "missing";
  label: string;
  description?: string;
  templateId?: string;
  documentId?: string;
  createdAt?: string;
  href?: string;
  sourceEvidenceId?: string;
};

export type ExternalEvidenceEntry = {
  id: string;
  label: string;
  evidenceType: string;
  note?: string;
  status: "available" | "ready";
  createdAt?: string;
  observedAt?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  bucket?: string;
  storagePath?: string;
  publicUrl?: string;
};

export type ArchivedEvidenceEntry = ExternalEvidenceEntry & {
  archivedAt: string;
  archiveReason?: string;
};

export type EvidenceAuditEvent = {
  id: string;
  action: "added" | "uploaded" | "archived" | "restored" | "purged";
  evidenceId: string;
  label: string;
  at: string;
  note?: string;
};

export type EvidenceModerationState = {
  status: "open" | "resolved";
  note?: string;
  resolutionReason?: string;
  needsFollowUp?: boolean;
  assigneeEmail?: string;
  updatedAt?: string;
  reviewerId?: string;
  reviewerEmail?: string;
};

export type CaseWorkflowSummary = {
  completedSteps: number;
  stepCount: number;
  completedChecklistCount: number;
  checklistCount: number;
  overdueCount: number;
  dueSoonCount: number;
  deadlineSeverity: "low" | "medium" | "high" | "critical";
  escalationReadiness: "low" | "medium" | "high";
  escalationScore: number;
  nextPendingStepTitle?: string;
  nextPendingDueDate?: string;
  availableEvidenceCount: number;
  missingEvidenceCount: number;
};

export type EmployerTrustSnapshot = {
  companyId: string;
  companyName: string;
  overallScore: number;
  confidenceLevel: "low" | "medium" | "high";
  confidenceLabel: string;
  sourceMixLabel: string;
  whyThisResult: string;
  lastUpdatedAt?: string | null;
  riskLevel?: "low" | "medium" | "high";
  riskReasons?: string[];
  verificationTotal?: number;
  criticalQueueCount?: number;
  salarySubmissionCount?: number;
  medianMonthlySalary?: number | null;
};

export type CaseTimelinePayload = Record<string, unknown> & {
  steps?: TimelineStep[];
  evidenceChecklist?: ChecklistItem[];
  stepStates?: Record<string, StepState>;
  documents?: TimelineDocument[];
  externalEvidence?: ExternalEvidenceEntry[];
  archivedExternalEvidence?: ArchivedEvidenceEntry[];
  evidenceAuditTrail?: EvidenceAuditEvent[];
  evidenceModeration?: EvidenceModerationState;
  evidenceArtifacts?: CaseEvidenceArtifact[];
  workflowSummary?: CaseWorkflowSummary;
  employerTrust?: EmployerTrustSnapshot;
};

export function getCaseStepKey(step: TimelineStep, index: number) {
  return step.code?.trim() || `step-${index + 1}`;
}

export function buildEvidenceChecklist(
  caseType: string,
  options: { evidenceReady?: boolean; internalResolutionAttempted?: boolean } = {},
): ChecklistItem[] {
  const common: ChecklistItem[] = [
    {
      id: "employment-proof",
      label: "Preuves de relation de travail rassemblees",
      done: Boolean(options.evidenceReady),
    },
    {
      id: "chronology",
      label: "Chronologie des faits et echanges consolidee",
      done: false,
    },
    {
      id: "internal-trace",
      label: "Trace d'echange interne ou relance conservee",
      done: Boolean(options.internalResolutionAttempted),
    },
  ];

  if (caseType === "salary_delay" || caseType === "unpaid_salary") {
    return [
      ...common,
      {
        id: "salary-proof",
        label: "Bulletins, releves ou montants dus identifies",
        done: Boolean(options.evidenceReady),
      },
    ];
  }

  if (caseType === "unpaid_overtime") {
    return [
      ...common,
      {
        id: "hours-proof",
        label: "Planning, badgeuse ou preuves horaires rassemblees",
        done: Boolean(options.evidenceReady),
      },
    ];
  }

  if (caseType === "abusive_dismissal") {
    return [
      ...common,
      {
        id: "dismissal-proof",
        label: "Convocation, notification ou preuve de rupture conservee",
        done: Boolean(options.evidenceReady),
      },
    ];
  }

  if (caseType === "harassment") {
    return [
      ...common,
      {
        id: "harassment-proof",
        label: "Messages, temoins ou preuves medicales centralises",
        done: Boolean(options.evidenceReady),
      },
    ];
  }

  return common;
}

function toDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeCaseTimeline(caseType: string, rawTimeline: Record<string, unknown>): CaseTimelinePayload {
  const steps = Array.isArray(rawTimeline.steps) ? (rawTimeline.steps as TimelineStep[]) : [];
  const rawChecklist = Array.isArray(rawTimeline.evidenceChecklist)
    ? (rawTimeline.evidenceChecklist as ChecklistItem[])
    : buildEvidenceChecklist(caseType);
  const rawStepStates =
    rawTimeline.stepStates && typeof rawTimeline.stepStates === "object"
      ? (rawTimeline.stepStates as Record<string, StepState>)
      : {};
  const documents = Array.isArray(rawTimeline.documents) ? (rawTimeline.documents as TimelineDocument[]) : [];
  const externalEvidence: ExternalEvidenceEntry[] = Array.isArray(rawTimeline.externalEvidence)
    ? (rawTimeline.externalEvidence as ExternalEvidenceEntry[]).map((item): ExternalEvidenceEntry => ({
        id: item.id,
        label: item.label,
        evidenceType: item.evidenceType,
        note: item.note,
        status: item.status === "ready" ? ("ready" as const) : ("available" as const),
        createdAt: item.createdAt,
        observedAt: item.observedAt,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: typeof item.fileSize === "number" ? item.fileSize : undefined,
        bucket: item.bucket,
        storagePath: item.storagePath,
        publicUrl: item.publicUrl,
      }))
    : [];
  const archivedExternalEvidence: ArchivedEvidenceEntry[] = Array.isArray(rawTimeline.archivedExternalEvidence)
    ? (rawTimeline.archivedExternalEvidence as ArchivedEvidenceEntry[]).map((item): ArchivedEvidenceEntry => ({
        id: item.id,
        label: item.label,
        evidenceType: item.evidenceType,
        note: item.note,
        status: item.status === "ready" ? ("ready" as const) : ("available" as const),
        createdAt: item.createdAt,
        observedAt: item.observedAt,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: typeof item.fileSize === "number" ? item.fileSize : undefined,
        bucket: item.bucket,
        storagePath: item.storagePath,
        publicUrl: item.publicUrl,
        archivedAt: item.archivedAt,
        archiveReason: item.archiveReason,
      }))
    : [];
  const evidenceAuditTrail = Array.isArray(rawTimeline.evidenceAuditTrail)
    ? (rawTimeline.evidenceAuditTrail as EvidenceAuditEvent[]).map((item) => ({
        id: item.id,
        action: item.action,
        evidenceId: item.evidenceId,
        label: item.label,
        at: item.at,
        note: item.note,
      }))
    : [];
  const evidenceModeration =
    rawTimeline.evidenceModeration && typeof rawTimeline.evidenceModeration === "object"
      ? {
          status:
            (rawTimeline.evidenceModeration as Record<string, unknown>).status === "resolved"
              ? ("resolved" as const)
              : ("open" as const),
          note:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).note === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).note)
              : undefined,
          resolutionReason:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).resolutionReason === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).resolutionReason)
              : undefined,
          needsFollowUp:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).needsFollowUp === "boolean"
              ? Boolean((rawTimeline.evidenceModeration as Record<string, unknown>).needsFollowUp)
              : false,
          assigneeEmail:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).assigneeEmail === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).assigneeEmail)
              : undefined,
          updatedAt:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).updatedAt === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).updatedAt)
              : undefined,
          reviewerId:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).reviewerId === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).reviewerId)
              : undefined,
          reviewerEmail:
            typeof (rawTimeline.evidenceModeration as Record<string, unknown>).reviewerEmail === "string"
              ? String((rawTimeline.evidenceModeration as Record<string, unknown>).reviewerEmail)
              : undefined,
        }
      : {
          status: "open" as const,
          needsFollowUp: false,
        };
  const employerTrust =
    rawTimeline.employerTrust && typeof rawTimeline.employerTrust === "object"
      ? {
          companyId:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).companyId === "string"
              ? String((rawTimeline.employerTrust as Record<string, unknown>).companyId)
              : "",
          companyName:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).companyName === "string"
              ? String((rawTimeline.employerTrust as Record<string, unknown>).companyName)
              : "",
          overallScore:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).overallScore === "number"
              ? Number((rawTimeline.employerTrust as Record<string, unknown>).overallScore)
              : 0,
          confidenceLevel:
            (rawTimeline.employerTrust as Record<string, unknown>).confidenceLevel === "high"
              ? ("high" as const)
              : (rawTimeline.employerTrust as Record<string, unknown>).confidenceLevel === "medium"
                ? ("medium" as const)
                : ("low" as const),
          confidenceLabel:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).confidenceLabel === "string"
              ? String((rawTimeline.employerTrust as Record<string, unknown>).confidenceLabel)
              : "Confiance en construction",
          sourceMixLabel:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).sourceMixLabel === "string"
              ? String((rawTimeline.employerTrust as Record<string, unknown>).sourceMixLabel)
              : "Signaux limites",
          whyThisResult:
            typeof (rawTimeline.employerTrust as Record<string, unknown>).whyThisResult === "string"
              ? String((rawTimeline.employerTrust as Record<string, unknown>).whyThisResult)
              : "",
            lastUpdatedAt:
              typeof (rawTimeline.employerTrust as Record<string, unknown>).lastUpdatedAt === "string"
                ? String((rawTimeline.employerTrust as Record<string, unknown>).lastUpdatedAt)
                : undefined,
            riskLevel:
              (rawTimeline.employerTrust as Record<string, unknown>).riskLevel === "high"
                ? ("high" as const)
                : (rawTimeline.employerTrust as Record<string, unknown>).riskLevel === "medium"
                  ? ("medium" as const)
                  : (rawTimeline.employerTrust as Record<string, unknown>).riskLevel === "low"
                    ? ("low" as const)
                    : undefined,
            riskReasons: Array.isArray((rawTimeline.employerTrust as Record<string, unknown>).riskReasons)
              ? ((rawTimeline.employerTrust as Record<string, unknown>).riskReasons as unknown[])
                  .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
              : undefined,
            verificationTotal:
              typeof (rawTimeline.employerTrust as Record<string, unknown>).verificationTotal === "number"
                ? Number((rawTimeline.employerTrust as Record<string, unknown>).verificationTotal)
                : undefined,
            criticalQueueCount:
              typeof (rawTimeline.employerTrust as Record<string, unknown>).criticalQueueCount === "number"
                ? Number((rawTimeline.employerTrust as Record<string, unknown>).criticalQueueCount)
                : undefined,
            salarySubmissionCount:
              typeof (rawTimeline.employerTrust as Record<string, unknown>).salarySubmissionCount === "number"
                ? Number((rawTimeline.employerTrust as Record<string, unknown>).salarySubmissionCount)
                : undefined,
            medianMonthlySalary:
              typeof (rawTimeline.employerTrust as Record<string, unknown>).medianMonthlySalary === "number"
                ? Number((rawTimeline.employerTrust as Record<string, unknown>).medianMonthlySalary)
                : (rawTimeline.employerTrust as Record<string, unknown>).medianMonthlySalary === null
                  ? null
                  : undefined,
          }
        : undefined;

  const stepStates = Object.fromEntries(
    steps.map((step, index) => {
      const key = getCaseStepKey(step, index);
      return [key, rawStepStates[key] ?? { done: false }];
    }),
  );

  const checklist = rawChecklist.map((item) => ({
    id: item.id,
    label: item.label,
    done: Boolean(item.done),
  }));

  const now = new Date();
  const completedSteps = steps.filter((step, index) => stepStates[getCaseStepKey(step, index)]?.done).length;
  const completedChecklistCount = checklist.filter((item) => item.done).length;

  const overdueCount = steps.filter((step, index) => {
    const state = stepStates[getCaseStepKey(step, index)];
    const dueDate = toDate(step.dueDate);
    return Boolean(dueDate && !state?.done && dueDate < now);
  }).length;

  const dueSoonCount = steps.filter((step, index) => {
    const state = stepStates[getCaseStepKey(step, index)];
    const dueDate = toDate(step.dueDate);
    if (!dueDate || state?.done || dueDate < now) return false;
    const diffDays = (dueDate.getTime() - now.getTime()) / 86400000;
    return diffDays <= 3;
  }).length;

  const nextPendingStep = steps.find((step, index) => !stepStates[getCaseStepKey(step, index)]?.done);
  const checklistRatio = checklist.length > 0 ? completedChecklistCount / checklist.length : 0;
  const stepRatio = steps.length > 0 ? completedSteps / steps.length : 0;
  const verifiedEvidenceCount = externalEvidence.filter((item) => item.status === "ready" || item.status === "available").length;
  const documentCoverage = checklist.length > 0 ? Math.min(1, (documents.length + verifiedEvidenceCount) / Math.ceil(checklist.length / 2)) : 0;
  const escalationScore = Math.round(checklistRatio * 50 + stepRatio * 15 + documentCoverage * 35);

  const workflowSummary: CaseWorkflowSummary = {
    completedSteps,
    stepCount: steps.length,
    completedChecklistCount,
    checklistCount: checklist.length,
    overdueCount,
    dueSoonCount,
    deadlineSeverity:
      overdueCount > 0 ? "critical" : dueSoonCount > 0 ? "high" : nextPendingStep ? "medium" : "low",
    escalationReadiness:
      escalationScore >= 75 ? "high" : escalationScore >= 40 ? "medium" : "low",
    escalationScore,
    nextPendingStepTitle: nextPendingStep?.title,
    nextPendingDueDate: nextPendingStep?.dueDate,
    availableEvidenceCount: documents.length + verifiedEvidenceCount + completedChecklistCount,
    missingEvidenceCount: checklist.length - completedChecklistCount,
  };

  const evidenceArtifacts: CaseEvidenceArtifact[] = [
    ...externalEvidence.map((item): CaseEvidenceArtifact => ({
      id: `external:${item.id}`,
      kind: "external_evidence" as const,
      status: item.status === "ready" ? ("ready" as const) : ("available" as const),
      label: item.label,
      description:
        item.note ||
        (item.fileName ? `Fichier ajoute: ${item.fileName}.` : `Preuve declaree: ${item.evidenceType}.`),
      createdAt: item.createdAt || item.observedAt,
      sourceEvidenceId: item.id,
    })),
    ...documents.map((document) => ({
      id: `document:${document.id ?? document.templateId ?? document.createdAt ?? "unknown"}`,
      kind: "generated_document" as const,
      status: "available" as const,
      label: document.templateTitle || document.templateId || "Document genere",
      description: "Document genere et rattache au dossier.",
      templateId: document.templateId,
      documentId: document.id,
      createdAt: document.createdAt,
      href: document.templateId ? `/documents/${document.templateId}` : undefined,
    })),
    ...checklist.map((item) => ({
      id: `checklist:${item.id}`,
      kind: "checklist_requirement" as const,
      status: item.done ? ("ready" as const) : ("missing" as const),
      label: item.label,
      description: item.done
        ? "Element de preuve signale comme disponible."
        : "Element de preuve encore a reunir.",
    })),
  ];

  return {
    ...rawTimeline,
    steps,
    evidenceChecklist: checklist,
    stepStates,
    documents,
    externalEvidence,
    archivedExternalEvidence,
    evidenceAuditTrail,
    evidenceModeration,
    evidenceArtifacts,
    workflowSummary,
    employerTrust,
  };
}
