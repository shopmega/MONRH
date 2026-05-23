"use client";

import { useEffect, useState } from "react";
import { Cloud, Download, RefreshCw, Upload } from "lucide-react";
import {
  applyEmployerWorkspaceSnapshot,
  collectEmployerWorkspaceSnapshot,
  type EmployerWorkspaceSnapshot,
} from "@/lib/employer/workspace-snapshot";

type WorkspaceResponse = {
  ok: boolean;
  item?: {
    updatedAt: string;
    payload: EmployerWorkspaceSnapshot;
  } | null;
  error?: string;
  message?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Aucune sauvegarde";
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EmployerWorkspaceSyncClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);

  async function refreshStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/employer/workspace", { cache: "no-store" });
      const data = (await response.json()) as WorkspaceResponse;
      if (response.status === 401) {
        setAuthenticated(false);
        setMessage("Connectez-vous pour activer la sauvegarde cloud du workspace.");
        return;
      }
      if (!response.ok || !data.ok) {
        setMessage(data.message ?? "Sauvegarde cloud indisponible.");
        return;
      }
      setLastSavedAt(data.item?.updatedAt ?? null);
      setMessage(null);
    } catch {
      setMessage("Sauvegarde cloud indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function saveWorkspace() {
    setSaving(true);
    setMessage(null);
    try {
      const snapshot = collectEmployerWorkspaceSnapshot();
      const response = await fetch("/api/employer/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      const data = (await response.json()) as WorkspaceResponse;
      if (response.status === 401) {
        setAuthenticated(false);
        setMessage("Connectez-vous pour sauvegarder le workspace.");
        return;
      }
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Sauvegarde impossible.");
      }
      setLastSavedAt(data.item?.updatedAt ?? snapshot.savedAt);
      setMessage("Workspace employeur sauvegarde.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function restoreWorkspace() {
    setRestoring(true);
    setMessage(null);
    try {
      const response = await fetch("/api/employer/workspace", { cache: "no-store" });
      const data = (await response.json()) as WorkspaceResponse;
      if (!response.ok || !data.ok || !data.item?.payload) {
        throw new Error(data.message ?? "Aucune sauvegarde a restaurer.");
      }
      applyEmployerWorkspaceSnapshot(data.item.payload);
      setMessage("Workspace restaure. Rechargement en cours...");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restauration impossible.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Sauvegarde
            </p>
            <h2 className="mt-2 text-xl font-black">Workspace employeur</h2>
          </div>
          <Cloud className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Synchronise les entreprises, salaries, paies, absences, pointages et brouillons de contrats du portail.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-lg bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-bold text-[var(--ink-soft)]">Derniere sauvegarde</p>
          <p className="mt-1 text-sm font-black text-[var(--heading)]">
            {loading ? "Verification..." : formatDate(lastSavedAt)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={saveWorkspace}
            disabled={!authenticated || saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={restoreWorkspace}
            disabled={!authenticated || restoring || !lastSavedAt}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-bold hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {restoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Restaurer
          </button>
        </div>

        {message ? (
          <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p>
        ) : null}
      </div>
    </section>
  );
}
