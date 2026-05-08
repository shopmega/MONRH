"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminModerationQueueItemControls({
  queueId,
  status,
  priority,
  isAssignedToCurrentAdmin,
}: {
  queueId: string;
  status: string;
  priority: string;
  isAssignedToCurrentAdmin: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>();

  async function runAction(
    action: "take" | "release" | "set_priority" | "set_status",
    nextPriority?: "normal" | "critical",
    nextStatus?: "open" | "resolved" | "dismissed",
  ) {
    setPendingAction(
      action === "set_priority"
        ? `priority:${nextPriority}`
        : action === "set_status"
          ? `status:${nextStatus}`
          : action,
    );
    setFeedback(undefined);

    try {
      const response = await fetch("/api/admin/moderation-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queueId,
          action,
          priority: nextPriority,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("queue_action_failed");
      }

      setFeedback("Mis a jour.");
      router.refresh();
    } catch {
      setFeedback("Echec mise a jour.");
    } finally {
      setPendingAction(null);
    }
  }

  const priorityTarget = priority === "critical" ? "normal" : "critical";
  const isTerminal = status === "resolved" || status === "dismissed";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isTerminal && isAssignedToCurrentAdmin ? (
        <button
          type="button"
          onClick={() => runAction("release")}
          disabled={pendingAction !== null}
          className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--ink-soft)]"
        >
          {pendingAction === "release" ? "Relache..." : "Relacher"}
        </button>
      ) : !isTerminal ? (
        <button
          type="button"
          onClick={() => runAction("take")}
          disabled={pendingAction !== null}
          className="rounded-full bg-[var(--foreground)] px-3 py-1 text-[11px] font-semibold text-[var(--background)]"
        >
          {pendingAction === "take" ? "Prise..." : status === "open" ? "Prendre" : "Me l'assigner"}
        </button>
      ) : null}
      {!isTerminal ? (
        <>
          <button
            type="button"
            onClick={() => runAction("set_status", undefined, "resolved")}
            disabled={pendingAction !== null}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent)]"
          >
            {pendingAction === "status:resolved" ? "Resolution..." : "Resoudre"}
          </button>
          <button
            type="button"
            onClick={() => runAction("set_status", undefined, "dismissed")}
            disabled={pendingAction !== null}
            className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--ink-soft)]"
          >
            {pendingAction === "status:dismissed" ? "Cloture..." : "Ecarter"}
          </button>
          <button
            type="button"
            onClick={() => runAction("set_priority", priorityTarget)}
            disabled={pendingAction !== null}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent)]"
          >
            {pendingAction === `priority:${priorityTarget}`
              ? "Maj..."
              : priority === "critical"
                ? "Normaliser"
                : "Critique"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => runAction("set_status", undefined, "open")}
          disabled={pendingAction !== null}
          className="rounded-full bg-[var(--foreground)] px-3 py-1 text-[11px] font-semibold text-[var(--background)]"
        >
          {pendingAction === "status:open" ? "Reouverture..." : "Reouvrir"}
        </button>
      )}
      {feedback ? <span className="text-[10px] text-[var(--ink-soft)]">{feedback}</span> : null}
    </div>
  );
}
