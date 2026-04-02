"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { buildToolResultDocumentLinks } from "@/lib/tools/result-document-links";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

type Result = {
  riskScore: number;
  level: "low" | "medium" | "high";
  steps: Array<{
    code: string;
    title: string;
    description: string;
    dueDate: string;
    documentTemplateId?: string;
    documentHref?: string;
  }>;
};

export default function PreLitigationTimelinePage() {
  const { t, locale, language } = useLanguage();
  const [form, setForm] = useState({
    incidentDate: "2026-02-01",
    scenario: "salary_delay",
    internalResolutionAttempted: false,
    evidenceReady: false,
    urgentFinancialPressure: false,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "pre_litigation_timeline");
  const userAuthenticated = config.userAuthenticated;
  const usable = canUseTool(toolPolicy, userAuthenticated);
  const relatedModelsLabel = language === "ar" ? "نماذج مفيدة" : "Modeles utiles";
  const relatedDocs = result
    ? buildToolResultDocumentLinks({
        toolId: "pre_litigation_timeline",
        result,
      })
    : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!usable) {
      setError(
        toolPolicy?.visible === false
          ? "Outil masque par l'administration."
          : toolPolicy?.enabled === false
            ? "Outil desactive par l'administration."
            : "Outil reserve aux utilisateurs connectes.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/tools/pre-litigation-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { ok: boolean; result?: Result; error?: string };
      if (!data.ok || !data.result) throw new Error(data.error ?? "request_failed");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <p className="section-kicker">{t("timelineTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("timelineTool.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("timelineTool.description")}</p>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("timelineTool.incidentDate")}
            <input
              className="input-shell mt-1"
              type="date"
              value={form.incidentDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, incidentDate: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("timelineTool.scenario")}
            <select
              className="input-shell mt-1"
              value={form.scenario}
              onChange={(event) => setForm((current) => ({ ...current, scenario: event.target.value }))}
            >
              <option value="salary_delay">{t("timelineTool.scenario_salary_delay")}</option>
              <option value="unpaid_salary">{t("timelineTool.scenario_unpaid_salary")}</option>
              <option value="unpaid_overtime">{t("timelineTool.scenario_unpaid_overtime")}</option>
              <option value="abusive_dismissal">{t("timelineTool.scenario_abusive_dismissal")}</option>
              <option value="harassment">{t("timelineTool.scenario_harassment")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
            <input
              type="checkbox"
              checked={form.evidenceReady}
              onChange={(event) =>
                setForm((current) => ({ ...current, evidenceReady: event.target.checked }))
              }
            />
            {t("timelineTool.evidenceReady")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
            <input
              type="checkbox"
              checked={form.internalResolutionAttempted}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  internalResolutionAttempted: event.target.checked,
                }))
              }
            />
            {t("timelineTool.internalAttempted")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.urgentFinancialPressure}
              onChange={(event) =>
                setForm((current) => ({ ...current, urgentFinancialPressure: event.target.checked }))
              }
            />
            {t("timelineTool.urgentPressure")}
          </label>
          <button className="btn-primary sm:col-span-2 px-4 py-2.5 text-sm" disabled={loading} type="submit">
            {loading ? t("timelineTool.submitting") : t("timelineTool.submit")}
          </button>
          {!usable ? (
            <p className="sm:col-span-2 break-words text-xs text-[var(--ink-soft)]">
              {toolPolicy?.enabled === false
                ? "Outil desactive par l'administration."
                : toolPolicy?.visible === false
                  ? "Outil masque par l'administration."
                  : "Acces reserve aux utilisateurs connectes."}
            </p>
          ) : null}
        </form>

        {error ? <p className="status-error mt-4 rounded-xl px-3 py-2 text-sm">{error}</p> : null}

        {result ? (
          <section className="soft-card mt-4 min-w-0 rounded-3xl p-5">
            <p className="display-font break-words text-3xl font-semibold">
              {t("timelineTool.risk", { score: result.riskScore, level: t(`timelineTool.${result.level}`) })}
            </p>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">{t("timelineTool.timelineTitle")}</p>
            <div className="mt-4 space-y-3">
              {result.steps.map((step, index) => (
                <article key={`${step.code}-${index}`} className="panel-strong min-w-0 rounded-xl p-3 text-sm">
                  <p className="font-semibold">{index + 1}. {step.title}</p>
                  <p className="mt-1 break-words text-[var(--ink-soft)]">{step.description}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {t("timelineTool.dueDate")}: {new Date(step.dueDate).toLocaleDateString(locale)}
                  </p>
                  {step.documentHref ? (
                    <Link href={step.documentHref} className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]">
                      {t("timelineTool.openDocument")}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
            {relatedDocs.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                <p className="section-kicker">{relatedModelsLabel}</p>
                <div className="mt-2 space-y-2">
                  {relatedDocs.map((doc) => (
                    <div key={doc.href} className="panel-strong rounded-xl p-3">
                      <p className="text-sm font-semibold">{doc.title}</p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">{doc.description}</p>
                      <Link href={doc.href} className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]">
                        {t("documentsPage.openTemplate")}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
