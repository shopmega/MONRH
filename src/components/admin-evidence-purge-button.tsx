"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminEvidencePurgeButton({
  caseId,
  evidenceId,
}: {
  caseId: string;
  evidenceId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>();

  async function purge() {
    setPending(true);
    setStatus(undefined);

    try {
      const response = await fetch(
        `/api/admin/evidence/purge?caseId=${encodeURIComponent(caseId)}&evidenceId=${encodeURIComponent(evidenceId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("purge_failed");
      }

      setStatus("Purgee.");
      router.refresh();
    } catch {
      setStatus("Echec purge.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={purge}
        disabled={pending}
        className="text-xs font-semibold text-[var(--error-ink)]"
      >
        {pending ? "Purge..." : "Purger"}
      </button>
      {status ? <span className="text-[10px] text-[var(--ink-soft)]">{status}</span> : null}
    </div>
  );
}
