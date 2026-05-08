"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type ExternalEvidenceEntry,
  type CaseTimelinePayload,
  type EmployerTrustSnapshot,
  type TimelineStep,
  getCaseStepKey,
  normalizeCaseTimeline,
} from "@/lib/cases/timeline";

function appendCaseId(href: string, caseId: string) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("caseId", caseId);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return "Non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return date.toLocaleDateString(locale);
}

function deadlineSeverityLabel(value: "low" | "medium" | "high" | "critical") {
  if (value === "critical") return "Retard critique";
  if (value === "high") return "Echeance proche";
  if (value === "medium") return "A suivre";
  return "Sous controle";
}

function escalationReadinessLabel(value: "low" | "medium" | "high") {
  if (value === "high") return "Pret a escalader";
  if (value === "medium") return "Preparation en cours";
  return "Dossier fragile";
}

function getEmployerTrustGuidance(employerTrust?: EmployerTrustSnapshot) {
  if (!employerTrust) return null;

  if (employerTrust.riskLevel === "high" && employerTrust.riskReasons?.length) {
    return {
      tone: "warning" as const,
      title: "Employeur a risque eleve",
      body: employerTrust.riskReasons[0],
    };
  }

  if (employerTrust.overallScore < 40 || employerTrust.confidenceLevel === "low") {
    return {
      tone: "warning" as const,
      title: "Employeur a confiance faible",
      body: "Priorisez les preuves ecrites, evitez les accords verbaux seuls et preparez plus vite une escalade externe si l interne bloque.",
    };
  }

  if (employerTrust.overallScore < 65 || employerTrust.confidenceLevel === "medium") {
    return {
      tone: "caution" as const,
      title: "Employeur a risque modere",
      body: "Documentez chaque engagement, gardez une chronologie propre et ne cloturez pas le dossier sans trace ecrite exploitable.",
    };
  }

  return {
    tone: "info" as const,
    title: "Employeur relativement fiable",
    body: "Le contexte est plus solide, mais conservez quand meme chaque preuve et chaque date-cle avant toute demarche.",
  };
}

function trustToneClasses(tone: "warning" | "caution" | "info") {
  if (tone === "warning") {
    return "border-rose-200 bg-rose-50";
  }
  if (tone === "caution") {
    return "border-amber-200 bg-amber-50";
  }
  return "border-emerald-200 bg-emerald-50";
}

export function CaseWorkflowPanel({
  caseId,
  caseType,
  initialTimeline,
  locale,
}: {
  caseId: string;
  caseType: string;
  initialTimeline: Record<string, unknown>;
  locale: string;
}) {
  const [timeline, setTimeline] = useState<CaseTimelinePayload>(() => normalizeCaseTimeline(caseType, initialTimeline));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>();
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [evidenceType, setEvidenceType] = useState("email");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceObservedAt, setEvidenceObservedAt] = useState("");
  const [evidenceStatus, setEvidenceStatus] = useState<"available" | "ready">("available");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const steps = timeline.steps ?? [];
  const checklist = timeline.evidenceChecklist ?? [];
  const stepStates = timeline.stepStates ?? {};
  const evidenceArtifacts = timeline.evidenceArtifacts ?? [];
  const externalEvidence = timeline.externalEvidence ?? [];
  const archivedEvidence = timeline.archivedExternalEvidence ?? [];
  const evidenceAuditTrail = timeline.evidenceAuditTrail ?? [];
  const summary = timeline.workflowSummary;
  const employerTrust = timeline.employerTrust;
  const trustGuidance = getEmployerTrustGuidance(employerTrust);

  async function persist(nextTimeline: CaseTimelinePayload) {
    const normalizedTimeline = normalizeCaseTimeline(caseType, nextTimeline);
    const previousTimeline = timeline;
    setTimeline(normalizedTimeline);
    setSaving(true);
    setSaveStatus(undefined);

    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline: normalizedTimeline }),
      });

      if (!response.ok) {
        throw new Error("case-update-failed");
      }

      const data = (await response.json()) as { item?: { timeline?: Record<string, unknown> } };
      const savedTimeline = data.item?.timeline ? normalizeCaseTimeline(caseType, data.item.timeline) : normalizedTimeline;
      setTimeline(savedTimeline);
      setSaveStatus("Dossier mis a jour.");
    } catch {
      setTimeline(previousTimeline);
      setSaveStatus("Mise a jour impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  function toggleChecklistItem(itemId: string) {
    const nextTimeline: CaseTimelinePayload = {
      ...timeline,
      evidenceChecklist: checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    };
    void persist(nextTimeline);
  }

  function toggleStep(step: TimelineStep, index: number) {
    const key = getCaseStepKey(step, index);
    const current = stepStates[key]?.done ?? false;
    const nextTimeline: CaseTimelinePayload = {
      ...timeline,
      stepStates: {
        ...stepStates,
        [key]: {
          done: !current,
          completedAt: !current ? new Date().toISOString() : undefined,
        },
      },
    };
    void persist(nextTimeline);
  }

  function addExternalEvidence() {
    const label = evidenceLabel.trim();
    if (!label) {
      setSaveStatus("Ajoutez un titre pour cette preuve.");
      return;
    }

    if (evidenceFile) {
      void uploadExternalEvidence(label);
      return;
    }

    const nextEntry: ExternalEvidenceEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      evidenceType,
      note: evidenceNote.trim() || undefined,
      observedAt: evidenceObservedAt || undefined,
      createdAt: new Date().toISOString(),
      status: evidenceStatus,
    };

    const nextTimeline: CaseTimelinePayload = {
      ...timeline,
      externalEvidence: [...externalEvidence, nextEntry],
    };

    setEvidenceLabel("");
    setEvidenceNote("");
    setEvidenceObservedAt("");
    setEvidenceType("email");
    setEvidenceStatus("available");
    void persist(nextTimeline);
  }

  async function uploadExternalEvidence(label: string) {
    if (!evidenceFile) {
      return;
    }

    setSaving(true);
    setSaveStatus(undefined);

    try {
      const formData = new FormData();
      formData.append("file", evidenceFile);
      formData.append("label", label);
      formData.append("evidenceType", evidenceType);
      formData.append("note", evidenceNote);
      formData.append("observedAt", evidenceObservedAt);
      formData.append("status", evidenceStatus);

      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/evidence-upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("upload-failed");
      }

      const data = (await response.json()) as { item?: { timeline?: Record<string, unknown> } };
      const savedTimeline = data.item?.timeline ? normalizeCaseTimeline(caseType, data.item.timeline) : timeline;
      setTimeline(savedTimeline);
      setEvidenceLabel("");
      setEvidenceNote("");
      setEvidenceObservedAt("");
      setEvidenceType("email");
      setEvidenceStatus("available");
      setEvidenceFile(null);
      setSaveStatus("Preuve televersee et rattachee au dossier.");
    } catch {
      setSaveStatus("Televersement impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveExternalEvidence(evidenceId: string) {
    setSaving(true);
    setSaveStatus(undefined);

    try {
      const response = await fetch(
        `/api/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("delete-failed");
      }

      const data = (await response.json()) as { item?: { timeline?: Record<string, unknown> } };
      const savedTimeline = data.item?.timeline ? normalizeCaseTimeline(caseType, data.item.timeline) : timeline;
      setTimeline(savedTimeline);
      setSaveStatus("Preuve archivee.");
    } catch {
      setSaveStatus("Archivage impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  async function restoreExternalEvidence(evidenceId: string) {
    setSaving(true);
    setSaveStatus(undefined);

    try {
      const response = await fetch(
        `/api/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}/restore`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("restore-failed");
      }

      const data = (await response.json()) as { item?: { timeline?: Record<string, unknown> } };
      const savedTimeline = data.item?.timeline ? normalizeCaseTimeline(caseType, data.item.timeline) : timeline;
      setTimeline(savedTimeline);
      setSaveStatus("Preuve restauree dans le dossier.");
    } catch {
      setSaveStatus("Restauration impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  function evidenceKindLabel(kind: string) {
    if (kind === "generated_document") return "Document";
    if (kind === "external_evidence") return "Preuve";
    return "Checklist";
  }

  return (
    <section className="soft-card rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-font text-2xl font-semibold">Pilotage dossier</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Suivez vos preuves, vos etapes en cours et votre prochaine action utile.
          </p>
        </div>
        {saving ? <span className="text-xs font-semibold text-[var(--ink-soft)]">Enregistrement...</span> : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Preuves</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {summary?.completedChecklistCount ?? 0} / {checklist.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Etapes bouclees</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {summary?.completedSteps ?? 0} / {steps.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Retards</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{summary?.overdueCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Urgence</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {deadlineSeverityLabel(summary?.deadlineSeverity ?? "medium")}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Escalade</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {escalationReadinessLabel(summary?.escalationReadiness ?? "low")}
          </p>
          {employerTrust ? (
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Ajuste selon employeur {employerTrust.overallScore}/100
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Pieces disponibles</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {summary?.availableEvidenceCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Prochaine action</p>
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
          {summary?.nextPendingStepTitle || "Toutes les etapes visibles sont marquees comme traitees."}
        </p>
        {summary?.nextPendingDueDate ? (
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Echeance: {formatDate(summary.nextPendingDueDate, locale)}
          </p>
        ) : null}
      </div>

        {trustGuidance && employerTrust ? (
          <div className={`mt-4 rounded-2xl border p-4 ${trustToneClasses(trustGuidance.tone)}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Guidance employeur
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
            {trustGuidance.title} | {employerTrust.confidenceLabel}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{trustGuidance.body}</p>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Sources: {employerTrust.sourceMixLabel}
            </p>
            {(typeof employerTrust.verificationTotal === "number" ||
              typeof employerTrust.salarySubmissionCount === "number" ||
              typeof employerTrust.criticalQueueCount === "number") ? (
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Verifications: {employerTrust.verificationTotal ?? 0}
                {" | "}
                Benchmarks salaire: {employerTrust.salarySubmissionCount ?? 0}
                {" | "}
                Queues critiques: {employerTrust.criticalQueueCount ?? 0}
              </p>
            ) : null}
            {typeof employerTrust.medianMonthlySalary === "number" ? (
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Mediane salaire memorisee: {employerTrust.medianMonthlySalary} MAD
              </p>
            ) : null}
          </div>
        ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Registre de preuves</p>
          <span className="text-xs text-[var(--ink-soft)]">{evidenceArtifacts.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {evidenceArtifacts.length === 0 ? (
            <div className="panel-strong rounded-2xl p-4 text-sm text-[var(--ink-soft)]">
              Aucune preuve structuree n'est encore rattachee au dossier.
            </div>
          ) : (
            evidenceArtifacts.map((artifact) => (
              <article key={artifact.id} className="panel-strong rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{artifact.label}</p>
                    {artifact.description ? (
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{artifact.description}</p>
                    ) : null}
                    {artifact.createdAt ? (
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        Ajoute le {formatDate(artifact.createdAt, locale)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                      {evidenceKindLabel(artifact.kind)}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                      {artifact.status}
                    </span>
                    {artifact.kind === "external_evidence" && artifact.sourceEvidenceId ? (
                      <Link
                        href={`/api/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(artifact.sourceEvidenceId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--accent)]"
                      >
                        Ouvrir
                      </Link>
                    ) : artifact.href ? (
                      <Link
                        href={appendCaseId(artifact.href, caseId)}
                        className="text-sm font-semibold text-[var(--accent)]"
                      >
                        Ouvrir
                      </Link>
                    ) : null}
                    {artifact.kind === "external_evidence" && artifact.sourceEvidenceId ? (
                      <button
                        type="button"
                        onClick={() => void archiveExternalEvidence(artifact.sourceEvidenceId as string)}
                        disabled={saving}
                        className="text-sm font-semibold text-[var(--ink-soft)]"
                      >
                        Archiver
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Preuves archivees</p>
          <span className="text-xs text-[var(--ink-soft)]">{archivedEvidence.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {archivedEvidence.length === 0 ? (
            <div className="panel-strong rounded-2xl p-4 text-sm text-[var(--ink-soft)]">
              Aucune preuve archivee.
            </div>
          ) : (
            archivedEvidence.map((item) => (
              <article key={item.id} className="panel-strong rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      Archivee le {formatDate(item.archivedAt, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.storagePath ? (
                      <Link
                        href={`/api/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(item.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--accent)]"
                      >
                        Ouvrir
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void restoreExternalEvidence(item.id)}
                      disabled={saving}
                      className="text-sm font-semibold text-[var(--accent)]"
                    >
                      Restaurer
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Ajouter une preuve externe</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Titre</span>
            <input
              value={evidenceLabel}
              onChange={(event) => setEvidenceLabel(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
              placeholder="Ex: Email RH du 12 mars"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Type</span>
            <select
              value={evidenceType}
              onChange={(event) => setEvidenceType(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="email">Email</option>
              <option value="payslip">Bulletin / releve</option>
              <option value="contract">Contrat / avenant</option>
              <option value="message">Message / capture</option>
              <option value="medical">Piece medicale</option>
              <option value="witness">Temoin / declaration</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Date observee</span>
            <input
              type="date"
              value={evidenceObservedAt}
              onChange={(event) => setEvidenceObservedAt(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Etat</span>
            <select
              value={evidenceStatus}
              onChange={(event) => setEvidenceStatus(event.target.value as "available" | "ready")}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="available">Disponible</option>
              <option value="ready">Pret pour escalade</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Note</span>
          <textarea
            value={evidenceNote}
            onChange={(event) => setEvidenceNote(event.target.value)}
            disabled={saving}
            className="min-h-[88px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Contexte, source, montant, interlocuteur, ou precision utile."
          />
        </label>
        <label className="mt-3 block space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Fichier optionnel</span>
          <input
            type="file"
            onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
            disabled={saving}
            className="block w-full text-sm text-[var(--foreground)]"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
          />
          <span className="text-xs text-[var(--ink-soft)]">
            PDF, image, texte, DOC ou DOCX. Taille max 10 Mo.
          </span>
        </label>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={addExternalEvidence} disabled={saving} className="btn-muted px-4 py-2 text-sm">
            {evidenceFile ? "Televerser la preuve" : "Ajouter la preuve"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Historique des preuves</p>
          <span className="text-xs text-[var(--ink-soft)]">{evidenceAuditTrail.length}</span>
        </div>
        <div className="mt-3 space-y-2">
          {evidenceAuditTrail.length === 0 ? (
            <div className="panel-strong rounded-2xl p-4 text-sm text-[var(--ink-soft)]">
              Aucun evenement de preuve enregistre.
            </div>
          ) : (
            evidenceAuditTrail
              .slice()
              .reverse()
              .slice(0, 6)
              .map((event) => (
                <div key={event.id} className="panel-strong rounded-2xl p-4 text-sm">
                  <p className="font-semibold text-[var(--foreground)]">
                    {event.action} | {event.label}
                  </p>
                  <p className="mt-1 text-[var(--ink-soft)]">
                    {formatDate(event.at, locale)}
                    {event.note ? ` | ${event.note}` : ""}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Checklist de preuves</p>
        <div className="mt-3 space-y-2">
          {checklist.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 ${
                saving ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleChecklistItem(item.id)}
                disabled={saving}
                className="mt-1 h-4 w-4 rounded border-[var(--line)]"
              />
              <span>
                <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                {employerTrust && !item.done && (employerTrust.overallScore < 40 || employerTrust.confidenceLevel === "low") ? (
                  <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                    Priorite elevee pour ce dossier vu le niveau de confiance employeur.
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Suivi des etapes</p>
        <div className="mt-3 space-y-3">
          {steps.length === 0 ? (
            <div className="panel-strong rounded-2xl p-4 text-sm text-[var(--ink-soft)]">
              Aucune etape detaillee n'est encore rattachee a ce dossier.
            </div>
          ) : (
            steps.map((step, index) => {
              const key = getCaseStepKey(step, index);
              const isDone = Boolean(stepStates[key]?.done);

              return (
                <article key={key} className="panel-strong rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <label className={`flex items-start gap-3 ${saving ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleStep(step, index)}
                        disabled={saving}
                        className="mt-1 h-4 w-4 rounded border-[var(--line)]"
                      />
                      <span>
                        <span className="block font-semibold text-[var(--foreground)]">
                          {index + 1}. {step.title || "Etape"}
                        </span>
                        {step.description ? (
                          <span className="mt-1 block text-sm text-[var(--ink-soft)]">{step.description}</span>
                        ) : null}
                      </span>
                    </label>
                    <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                      {formatDate(step.dueDate, locale)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[var(--ink-soft)]">
                      {isDone
                        ? `Traitee${stepStates[key]?.completedAt ? ` le ${formatDate(stepStates[key]?.completedAt, locale)}` : ""}`
                        : "En attente"}
                    </span>
                    {step.documentHref ? (
                      <Link
                        href={appendCaseId(step.documentHref, caseId)}
                        className="text-sm font-semibold text-[var(--accent)]"
                      >
                        Preparer le document associe
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {saveStatus ? <p className="mt-4 text-sm text-[var(--ink-soft)]">{saveStatus}</p> : null}
    </section>
  );
}
