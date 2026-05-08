"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminVerificationDecisionForm({
  verificationId,
}: {
  verificationId: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_more_info">("approved");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string>();

  async function submit() {
    setPending(true);
    setFeedback(undefined);
    try {
      const response = await fetch(`/api/admin/verifications/${encodeURIComponent(verificationId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });

      if (!response.ok) {
        throw new Error("decision_failed");
      }

      setFeedback("Decision enregistree.");
      router.refresh();
    } catch {
      setFeedback("Echec decision.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <div className="grid gap-3 lg:grid-cols-[180px,1fr]">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Decision
          </span>
          <select
            value={decision}
            onChange={(event) =>
              setDecision(
                event.target.value === "rejected"
                  ? "rejected"
                  : event.target.value === "needs_more_info"
                    ? "needs_more_info"
                    : "approved",
              )
            }
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="approved">Approuver</option>
            <option value="rejected">Rejeter</option>
            <option value="needs_more_info">Demander plus d'info</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Note
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Motif, demande de preuve, contexte..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--background)]"
        >
          {pending ? "Enregistrement..." : "Valider"}
        </button>
        {feedback ? <span className="text-xs text-[var(--ink-soft)]">{feedback}</span> : null}
      </div>
    </div>
  );
}
