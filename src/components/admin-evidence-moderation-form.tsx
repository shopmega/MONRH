"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ModerationStatus = "open" | "resolved";
const RESOLUTION_OPTIONS = [
  { value: "", label: "Aucune raison" },
  { value: "policy_ok", label: "Conforme a la politique" },
  { value: "retention_watch", label: "Sous surveillance retention" },
  { value: "missing_metadata", label: "Metadonnees incompletes" },
  { value: "user_request", label: "Demande utilisateur" },
  { value: "legal_sensitive", label: "Sujet sensible / legal" },
  { value: "other", label: "Autre" },
];

export function AdminEvidenceModerationForm({
  caseId,
  initialStatus,
  initialNote,
  initialResolutionReason,
  initialNeedsFollowUp,
  initialAssigneeEmail,
  updatedAt,
  reviewerEmail,
}: {
  caseId: string;
  initialStatus: ModerationStatus;
  initialNote?: string;
  initialResolutionReason?: string;
  initialNeedsFollowUp?: boolean;
  initialAssigneeEmail?: string;
  updatedAt?: string;
  reviewerEmail?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ModerationStatus>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [resolutionReason, setResolutionReason] = useState(initialResolutionReason ?? "");
  const [needsFollowUp, setNeedsFollowUp] = useState(Boolean(initialNeedsFollowUp));
  const [assigneeEmail, setAssigneeEmail] = useState(initialAssigneeEmail ?? "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string>();

  async function save() {
    setPending(true);
    setFeedback(undefined);

    try {
      const response = await fetch("/api/admin/evidence/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId,
          status,
          note,
          resolutionReason,
          needsFollowUp,
          assigneeEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("moderation_save_failed");
      }

      setFeedback("Revue enregistree.");
      router.refresh();
    } catch {
      setFeedback("Echec enregistrement.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Moderation</p>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            status === "resolved"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--warning-soft)] text-[var(--foreground)]"
          }`}
        >
          {status === "resolved" ? "Resolue" : "Ouverte"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[180px,1fr]">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Statut
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value === "resolved" ? "resolved" : "open")}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="open">Ouverte</option>
            <option value="resolved">Resolue</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Note reviewer
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Decision, contexte, suivi demande..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Raison
          </span>
          <select
            value={resolutionReason}
            onChange={(event) => setResolutionReason(event.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Assignee
          </span>
          <input
            type="email"
            value={assigneeEmail}
            onChange={(event) => setAssigneeEmail(event.target.value)}
            placeholder="reviewer@monrh.ma"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={needsFollowUp}
            onChange={(event) => setNeedsFollowUp(event.target.checked)}
          />
          <span>Suivi necessaire</span>
        </label>
      </div>

      {updatedAt || reviewerEmail ? (
        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          {reviewerEmail ? `Derniere revue: ${reviewerEmail}` : "Derniere revue"}{" "}
          {updatedAt ? `le ${new Date(updatedAt).toLocaleString("fr-MA")}` : ""}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--background)]"
        >
          {pending ? "Enregistrement..." : "Enregistrer la revue"}
        </button>
        {feedback ? <span className="text-xs text-[var(--ink-soft)]">{feedback}</span> : null}
      </div>
    </div>
  );
}
