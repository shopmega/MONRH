"use client";

import { useEffect, useMemo, useState } from "react";
import { TOOL_CATALOG, type ToolPolicy } from "@/lib/tools/tool-catalog";

type AdminConfig = {
  simulatorAdStepEnabled: boolean;
  documentAdStepEnabled: boolean;
  maintenanceMessage: string;
  websiteSettings: {
    siteName: string;
    siteDescription: string;
    siteSubtitle: string;
    logoUrl: string;
    supportEmail: string;
    defaultArticleCoverUrl: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      linkedin: string;
      x: string;
    };
  };
  toolPolicies: Record<string, ToolPolicy>;
  updatedAt: string;
};

function defaultPolicy(policy?: ToolPolicy): ToolPolicy {
  return policy ?? { visible: true, enabled: true, audience: "public" };
}

export default function AdminToolsPage() {
  const [config, setConfig] = useState<AdminConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const response = await fetch("/api/admin/config");
        const data = (await response.json()) as { ok: boolean; config?: AdminConfig };
        if (!active || !data.ok || !data.config) return;
        setConfig(data.config);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const groupedTools = useMemo(
    () => ({
      simulateurs: TOOL_CATALOG.filter((tool) => tool.kind === "simulator"),
      protection: TOOL_CATALOG.filter((tool) => tool.kind === "protection"),
    }),
    [],
  );

  function updateToolPolicy(toolId: string, patch: Partial<ToolPolicy>) {
    setConfig((current) => {
      if (!current) return current;
      const currentPolicy = defaultPolicy(current.toolPolicies[toolId]);
      return {
        ...current,
        toolPolicies: {
          ...current.toolPolicies,
          [toolId]: { ...currentPolicy, ...patch },
        },
      };
    });
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setStatus(undefined);

    const response = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulatorAdStepEnabled: config.simulatorAdStepEnabled,
        documentAdStepEnabled: config.documentAdStepEnabled,
        maintenanceMessage: config.maintenanceMessage,
        websiteSettings: config.websiteSettings,
        toolPolicies: config.toolPolicies,
      }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? ((await response.json()) as {
          ok?: boolean;
          config?: AdminConfig;
          error?: string;
          message?: string;
        })
      : null;

    if (response.ok && data?.ok && data.config) {
      setConfig(data.config);
      setStatus("Configuration mise a jour.");
    } else {
      const detail = data?.message ?? data?.error ?? `http_${response.status}`;
      setStatus(`Echec de mise a jour. (${detail})`);
    }
    setSaving(false);
  }

  if (loading) {
    return <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">Chargement...</section>;
  }

  if (!config) {
    return <section className="status-error rounded-3xl p-5 text-sm">Impossible de charger la configuration.</section>;
  }

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Tools Settings</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Configuration des outils</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Controle de visibilite, activation et audience (public / connecte) sans redemarrage.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-xl font-semibold">Monetisation</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
              <div>
                <p className="font-semibold">Ads sur simulateurs</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Affichage normal des blocs publicitaires.</p>
              </div>
              <input
                type="checkbox"
                checked={config.simulatorAdStepEnabled}
                onChange={(event) =>
                  setConfig((current) => (current ? { ...current, simulatorAdStepEnabled: event.target.checked } : current))
                }
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
              <div>
                <p className="font-semibold">Ads sur generateurs</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Active ou coupe les emplacements pub outils documents.</p>
              </div>
              <input
                type="checkbox"
                checked={config.documentAdStepEnabled}
                onChange={(event) =>
                  setConfig((current) => (current ? { ...current, documentAdStepEnabled: event.target.checked } : current))
                }
              />
            </label>
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-xl font-semibold">Maintenance</h3>
          <label className="mt-4 block text-sm font-semibold">
            Message maintenance (optionnel)
            <textarea
              value={config.maintenanceMessage}
              onChange={(event) =>
                setConfig((current) => (current ? { ...current, maintenanceMessage: event.target.value } : current))
              }
              rows={5}
              className="input-shell mt-1"
              placeholder="Ex: Mise a jour des baremes en cours, retour a 22:00."
            />
          </label>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Affiche une banniere globale sur le site public.
          </p>
        </article>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-xl font-semibold">Website Settings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Site name
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.siteName}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, siteName: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Site subtitle
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.siteSubtitle}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, siteSubtitle: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Site description (SEO)
            <textarea
              className="input-shell mt-1"
              rows={3}
              value={config.websiteSettings.siteDescription}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, siteDescription: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Logo URL
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.logoUrl}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, logoUrl: event.target.value },
                      }
                    : current,
                )
              }
              placeholder="https://..."
            />
          </label>
          <label className="text-sm font-semibold">
            Support email
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.supportEmail}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, supportEmail: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Default article cover URL
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.defaultArticleCoverUrl}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: { ...current.websiteSettings, defaultArticleCoverUrl: event.target.value },
                      }
                    : current,
                )
              }
              placeholder="https://..."
            />
          </label>
          <label className="text-sm font-semibold">
            Facebook
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.socialLinks.facebook}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: {
                          ...current.websiteSettings,
                          socialLinks: { ...current.websiteSettings.socialLinks, facebook: event.target.value },
                        },
                      }
                    : current,
                )
              }
              placeholder="https://facebook.com/..."
            />
          </label>
          <label className="text-sm font-semibold">
            Instagram
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.socialLinks.instagram}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: {
                          ...current.websiteSettings,
                          socialLinks: { ...current.websiteSettings.socialLinks, instagram: event.target.value },
                        },
                      }
                    : current,
                )
              }
              placeholder="https://instagram.com/..."
            />
          </label>
          <label className="text-sm font-semibold">
            LinkedIn
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.socialLinks.linkedin}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: {
                          ...current.websiteSettings,
                          socialLinks: { ...current.websiteSettings.socialLinks, linkedin: event.target.value },
                        },
                      }
                    : current,
                )
              }
              placeholder="https://linkedin.com/..."
            />
          </label>
          <label className="text-sm font-semibold">
            X / Twitter
            <input
              className="input-shell mt-1"
              value={config.websiteSettings.socialLinks.x}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        websiteSettings: {
                          ...current.websiteSettings,
                          socialLinks: { ...current.websiteSettings.socialLinks, x: event.target.value },
                        },
                      }
                    : current,
                )
              }
              placeholder="https://x.com/..."
            />
          </label>
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-xl font-semibold">Controle des simulateurs</h3>
        <div className="mt-3 space-y-2">
          {groupedTools.simulateurs.map((tool) => {
            const policy = defaultPolicy(config.toolPolicies[tool.id]);
            return (
              <div key={tool.id} className="panel-strong grid gap-3 rounded-xl p-3 md:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold">{tool.label}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{tool.href}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={policy.visible} onChange={(event) => updateToolPolicy(tool.id, { visible: event.target.checked })} />
                  Visible
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={policy.enabled} onChange={(event) => updateToolPolicy(tool.id, { enabled: event.target.checked })} />
                  Actif
                </label>
                <select className="input-shell h-9 min-w-[140px] text-sm" value={policy.audience} onChange={(event) => updateToolPolicy(tool.id, { audience: event.target.value as ToolPolicy["audience"] })}>
                  <option value="public">Public</option>
                  <option value="logged">Connecte uniquement</option>
                </select>
              </div>
            );
          })}
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-xl font-semibold">Controle des outils protection</h3>
        <div className="mt-3 space-y-2">
          {groupedTools.protection.map((tool) => {
            const policy = defaultPolicy(config.toolPolicies[tool.id]);
            return (
              <div key={tool.id} className="panel-strong grid gap-3 rounded-xl p-3 md:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold">{tool.label}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{tool.href}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={policy.visible} onChange={(event) => updateToolPolicy(tool.id, { visible: event.target.checked })} />
                  Visible
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={policy.enabled} onChange={(event) => updateToolPolicy(tool.id, { enabled: event.target.checked })} />
                  Actif
                </label>
                <select className="input-shell h-9 min-w-[140px] text-sm" value={policy.audience} onChange={(event) => updateToolPolicy(tool.id, { audience: event.target.value as ToolPolicy["audience"] })}>
                  <option value="public">Public</option>
                  <option value="logged">Connecte uniquement</option>
                </select>
              </div>
            );
          })}
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-soft)]">
            Derniere mise a jour: {new Date(config.updatedAt).toLocaleString("fr-MA")}
          </p>
          <button type="button" onClick={saveConfig} disabled={saving} className="btn-primary px-4 py-2 text-sm">
            {saving ? "Enregistrement..." : "Enregistrer les changements"}
          </button>
        </div>

        {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
      </section>
    </div>
  );
}
