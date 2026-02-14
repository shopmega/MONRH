"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LinkMapData, LinkSourceType, LinkTargets } from "@/lib/linking/link-map";

type CatalogItem = { id: string; label: string; href: string };

type LinkingPayload = {
  map: LinkMapData;
  catalog: {
    articles: CatalogItem[];
    tools: CatalogItem[];
    documents: CatalogItem[];
  };
};

function emptyTargets(): LinkTargets {
  return { articleSlugs: [], toolIds: [], documentIds: [] };
}

function toggle(items: string[], item: string) {
  return items.includes(item)
    ? items.filter((value) => value !== item)
    : [...items, item];
}

export default function AdminLinkingPage() {
  const [payload, setPayload] = useState<LinkingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [sourceType, setSourceType] = useState<LinkSourceType>("article");
  const [sourceId, setSourceId] = useState("");
  const [targets, setTargets] = useState<LinkTargets>(emptyTargets());

  const loadData = useCallback(async (): Promise<LinkingPayload | null> => {
    const response = await fetch("/api/admin/linking");
    const data = (await response.json()) as { ok: boolean } & Partial<LinkingPayload>;
    if (data.ok && data.map && data.catalog) {
      const nextPayload = { map: data.map, catalog: data.catalog };
      setPayload(nextPayload);
      return nextPayload;
    }
    return null;
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const nextPayload = await loadData();
      if (nextPayload) {
        const currentOptions = nextPayload.catalog.articles;
        const nextId = currentOptions[0]?.id ?? "";
        setSourceId(nextId);
        setTargets(nextPayload.map.article[nextId] ?? emptyTargets());
      }
      if (active) setLoading(false);
    }
    init();
    return () => {
      active = false;
    };
  }, [loadData]);

  const sourceOptions = useMemo(() => {
    if (!payload) return [];
    if (sourceType === "article") return payload.catalog.articles;
    if (sourceType === "simulator") return payload.catalog.tools;
    return payload.catalog.documents;
  }, [payload, sourceType]);
  const activeSourceId = sourceOptions.some((item) => item.id === sourceId)
    ? sourceId
    : (sourceOptions[0]?.id ?? "");

  async function saveMapping() {
    if (!activeSourceId) return;
    setSaving(true);
    setStatus(undefined);
    const response = await fetch("/api/admin/linking", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        sourceId: activeSourceId,
        targets,
      }),
    });
    const data = (await response.json()) as { ok: boolean };
    if (data.ok) {
      setStatus("Liens enregistres.");
      await loadData();
    } else {
      setStatus("Echec d'enregistrement.");
    }
    setSaving(false);
  }

  async function clearMapping() {
    if (!activeSourceId) return;
    setSaving(true);
    setStatus(undefined);
    const response = await fetch("/api/admin/linking", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType, sourceId: activeSourceId }),
    });
    const data = (await response.json()) as { ok: boolean };
    if (data.ok) {
      setStatus("Liens supprimes.");
      setTargets(emptyTargets());
      await loadData();
    } else {
      setStatus("Suppression impossible.");
    }
    setSaving(false);
  }

  if (loading) {
    return <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">Chargement...</section>;
  }

  if (!payload) {
    return <section className="status-error rounded-3xl p-5 text-sm">Impossible de charger le module linking.</section>;
  }

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Linking</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Liens contextuels</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Definissez les liens recommandes entre articles, simulateurs et generateurs.
        </p>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Type source
            <select className="input-shell mt-1" value={sourceType} onChange={(event) => {
              const nextType = event.target.value as LinkSourceType;
              setSourceType(nextType);
              const nextOptions =
                nextType === "article"
                  ? payload.catalog.articles
                  : nextType === "simulator"
                    ? payload.catalog.tools
                    : payload.catalog.documents;
              const nextId = nextOptions[0]?.id ?? "";
              setSourceId(nextId);
              setTargets(payload.map[nextType][nextId] ?? emptyTargets());
            }}>
              <option value="article">Article</option>
              <option value="simulator">Simulateur / Outil</option>
              <option value="document">Generateur document</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Element source
            <select className="input-shell mt-1" value={activeSourceId} onChange={(event) => {
              const nextId = event.target.value;
              setSourceId(nextId);
              setTargets(payload.map[sourceType][nextId] ?? emptyTargets());
            }}>
              {sourceOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-xl font-semibold">Articles lies</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
            {payload.catalog.articles.map((item) => (
              <label key={item.id} className="panel-strong flex items-start gap-2 rounded-xl p-3 text-sm">
                <input
                  type="checkbox"
                  checked={targets.articleSlugs.includes(item.id)}
                  onChange={() => setTargets((current) => ({ ...current, articleSlugs: toggle(current.articleSlugs, item.id) }))}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-xl font-semibold">Simulateurs / Outils lies</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
            {payload.catalog.tools.map((item) => (
              <label key={item.id} className="panel-strong flex items-start gap-2 rounded-xl p-3 text-sm">
                <input
                  type="checkbox"
                  checked={targets.toolIds.includes(item.id)}
                  onChange={() => setTargets((current) => ({ ...current, toolIds: toggle(current.toolIds, item.id) }))}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-xl font-semibold">Documents lies</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
            {payload.catalog.documents.map((item) => (
              <label key={item.id} className="panel-strong flex items-start gap-2 rounded-xl p-3 text-sm">
                <input
                  type="checkbox"
                  checked={targets.documentIds.includes(item.id)}
                  onChange={() => setTargets((current) => ({ ...current, documentIds: toggle(current.documentIds, item.id) }))}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={saveMapping} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer les liens"}
          </button>
          <button type="button" className="btn-muted px-4 py-2 text-sm" onClick={clearMapping} disabled={saving}>
            Supprimer ce mapping
          </button>
        </div>
        {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
      </section>
    </div>
  );
}
