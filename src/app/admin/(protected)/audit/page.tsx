"use client";

import { useEffect, useState } from "react";

type AuditEvent = {
  id: string;
  createdAt: string;
  action: string;
  status: "success" | "failed";
  meta?: Record<string, unknown>;
};

type Snapshot = {
  id: string;
  kind: "rules" | "config";
  createdAt: string;
  note?: string;
};

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [ruleSnapshots, setRuleSnapshots] = useState<Snapshot[]>([]);
  const [configSnapshots, setConfigSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>();
  const [restoringId, setRestoringId] = useState<string>();

  async function loadAll() {
    const [auditResponse, rulesResponse, configResponse] = await Promise.all([
      fetch("/api/admin/audit"),
      fetch("/api/admin/snapshots?kind=rules"),
      fetch("/api/admin/snapshots?kind=config"),
    ]);
    const auditData = (await auditResponse.json()) as { ok: boolean; events?: AuditEvent[] };
    const rulesData = (await rulesResponse.json()) as { ok: boolean; snapshots?: Snapshot[] };
    const configData = (await configResponse.json()) as { ok: boolean; snapshots?: Snapshot[] };
    if (auditData.ok && auditData.events) setEvents(auditData.events);
    if (rulesData.ok && rulesData.snapshots) setRuleSnapshots(rulesData.snapshots);
    if (configData.ok && configData.snapshots) setConfigSnapshots(configData.snapshots);
  }

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        await loadAll();
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  async function restoreSnapshot(snapshot: Snapshot) {
    setStatus(undefined);
    setRestoringId(snapshot.id);
    const response = await fetch("/api/admin/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId: snapshot.id, kind: snapshot.kind }),
    });
    const data = (await response.json()) as { ok: boolean };
    if (data.ok) {
      setStatus(`Restauration ${snapshot.kind} terminee.`);
      await loadAll();
    } else {
      setStatus("Restauration impossible.");
    }
    setRestoringId(undefined);
  }

  if (loading) {
    return <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">Chargement...</section>;
  }

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Audit</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Journal admin et restaurations</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Suivi des changements admin et restauration rapide de snapshots Rules/Config.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Snapshots Rules</h3>
          <div className="mt-3 space-y-2">
            {ruleSnapshots.slice(0, 10).map((item) => (
              <div key={item.id} className="panel-strong rounded-xl p-3">
                <p className="text-sm font-semibold">{item.note ?? "snapshot_rules"}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {new Date(item.createdAt).toLocaleString("fr-MA")}
                </p>
                <button
                  type="button"
                  className="btn-muted mt-2 px-3 py-1.5 text-xs"
                  disabled={restoringId === item.id}
                  onClick={() => restoreSnapshot(item)}
                >
                  {restoringId === item.id ? "Restauration..." : "Restaurer"}
                </button>
              </div>
            ))}
            {ruleSnapshots.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun snapshot rules.</p>
            ) : null}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Snapshots Config</h3>
          <div className="mt-3 space-y-2">
            {configSnapshots.slice(0, 10).map((item) => (
              <div key={item.id} className="panel-strong rounded-xl p-3">
                <p className="text-sm font-semibold">{item.note ?? "snapshot_config"}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {new Date(item.createdAt).toLocaleString("fr-MA")}
                </p>
                <button
                  type="button"
                  className="btn-muted mt-2 px-3 py-1.5 text-xs"
                  disabled={restoringId === item.id}
                  onClick={() => restoreSnapshot(item)}
                >
                  {restoringId === item.id ? "Restauration..." : "Restaurer"}
                </button>
              </div>
            ))}
            {configSnapshots.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun snapshot config.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Journal des actions admin</h3>
        <div className="mt-3 space-y-2">
          {events.map((event) => (
            <div key={event.id} className="panel-strong rounded-xl p-3">
              <p className="text-sm font-semibold">
                {event.action}{" "}
                <span className={event.status === "success" ? "text-[var(--accent)]" : "text-[var(--error-ink)]"}>
                  ({event.status})
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {new Date(event.createdAt).toLocaleString("fr-MA")}
              </p>
              {event.meta ? (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--surface-muted)] p-2 text-xs text-[var(--ink-soft)]">
                  {JSON.stringify(event.meta, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
          {events.length === 0 ? <p className="text-sm text-[var(--ink-soft)]">Aucun event admin.</p> : null}
        </div>
      </section>

      {status ? <p className="status-info rounded-xl px-3 py-2 text-sm">{status}</p> : null}
    </div>
  );
}
