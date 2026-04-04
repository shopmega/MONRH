"use client";

import { useState } from "react";

type CheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error: string | null;
};

type HealthPayload = {
  ok: boolean;
  scope?: "basic" | "all";
  timestamp?: string;
  error?: string;
  checks?: {
    env?: Array<{ name: string; present: boolean }>;
    base?: CheckResult[];
    database?: CheckResult[];
    apis?: CheckResult[];
  };
};

export function AdminHealthCheck() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<HealthPayload | null>(null);

  async function runChecks() {
    setLoading(true);
    try {
      const response = await fetch("/api/health?scope=all", { cache: "no-store" });
      const data = (await response.json()) as HealthPayload;
      setPayload(data);
    } catch {
      setPayload({ ok: false, error: "health_check_failed" });
    } finally {
      setLoading(false);
    }
  }

  const items = [
    ...(payload?.checks?.base ?? []),
    ...(payload?.checks?.database ?? []),
    ...(payload?.checks?.apis ?? []),
  ];

  return (
    <section className="soft-card rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Health</p>
          <h3 className="display-font mt-1 text-2xl font-semibold">API Diagnostics</h3>
        </div>
        <button type="button" onClick={runChecks} className="btn-primary px-4 py-2 text-sm" disabled={loading}>
          {loading ? "Vérification..." : "Vérifier les API"}
        </button>
      </div>

      {payload ? (
        <div className="mt-4 space-y-2">
          <p className={`text-sm font-semibold ${payload.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {payload.ok ? "Tous les contrôles sont OK" : "Des erreurs ont été détectées"}
          </p>
          {payload.error ? <p className="text-xs text-[var(--ink-soft)]">{payload.error}</p> : null}
          {payload.timestamp ? (
            <p className="text-xs text-[var(--ink-soft)]">
              Dernière vérification : {new Date(payload.timestamp).toLocaleString("fr-MA")}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <article key={item.name} className="panel-strong rounded-xl p-3 text-xs">
                <p className="font-semibold">{item.name}</p>
                <p className={`mt-1 ${item.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {item.ok ? "OK" : "Erreur"}
                </p>
                <p className="mt-1 text-[var(--ink-soft)]">{item.durationMs} ms</p>
                {item.error ? <p className="mt-1 break-words text-[var(--ink-soft)]">{item.error}</p> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
