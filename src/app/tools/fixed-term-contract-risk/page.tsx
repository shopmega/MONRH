"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { buildToolResultDocumentLinks } from "@/lib/tools/result-document-links";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import { SmartToggle, SmartStepper } from "@/components/ui/smart-inputs";

type Result = {
  riskScore: number;
  level: "low" | "medium" | "high";
  recommendationCodes: string[];
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export default function FixedTermContractRiskPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    contractReasonDocumented: true,
    contractHasEndDate: true,
    durationMonths: "12",
    renewalsCount: "0",
    roleIsPermanentNeed: false,
    trialPeriodDays: "15",
    salaryAndHoursClear: true,
    signedByBothParties: true,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "fixed_term_contract_risk");
  const userAuthenticated = config.userAuthenticated;
  const usable = canUseTool(toolPolicy, userAuthenticated);
  const relatedModelsLabel = t("toolsPage.relatedDocuments");
  const checklist = [
    "Confirmez le motif legal et la duree du CDD.",
    "Renseignez les renouvellements et la periode d'essai.",
    "Verifiez les clauses salariales et la signature des parties.",
  ];
  const relatedDocs = result
    ? buildToolResultDocumentLinks({
        toolId: "fixed_term_contract_risk",
        result,
      })
    : [];

  function getRiskUi(level: Result["level"]) {
    if (level === "high") return { badge: "bg-[#fde8e8] text-[#b42318]", label: "Risque Eleve" };
    if (level === "medium") return { badge: "bg-[#fff4e5] text-[#b54708]", label: "Risque Moyen" };
    return { badge: "bg-[#e8f6ed] text-[#067647]", label: "Risque Faible" };
  }

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
      const response = await fetch("/api/tools/fixed-term-contract-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMonths: Number(form.durationMonths),
          renewalsCount: Number(form.renewalsCount),
          trialPeriodDays: Number(form.trialPeriodDays),
        }),
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
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <p className="section-kicker">{t("cddRiskTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("cddRiskTool.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("cddRiskTool.description")}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Analyse</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Risque de requalification</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Sortie</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Score + recommandations</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Actions</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Modeles lies</p>
            </article>
          </div>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 space-y-6 rounded-3xl p-5 sm:p-7">
          <div className="panel-strong rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Checklist avant verification</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
              {checklist.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4">
            {[
              "contractReasonDocumented",
              "contractHasEndDate",
              "roleIsPermanentNeed",
              "salaryAndHoursClear",
              "signedByBothParties",
            ].map((key) => (
              <div key={key} className="rounded-2xl bg-[var(--surface-elevated)] p-2">
                <SmartToggle
                  label={t(`cddRiskTool.${key}`)}
                  value={form[key as keyof typeof form] as boolean}
                  onChange={(checked) =>
                    setForm((current) => ({ ...current, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SmartStepper
              label={t("cddRiskTool.durationMonths")}
              value={Number(form.durationMonths)}
              onChange={(val) => setForm((current) => ({ ...current, durationMonths: String(val) }))}
              min={1}
              max={24}
            />
            <SmartStepper
              label={t("cddRiskTool.renewalsCount")}
              value={Number(form.renewalsCount)}
              onChange={(val) => setForm((current) => ({ ...current, renewalsCount: String(val) }))}
              min={0}
              max={2}
            />
            <SmartStepper
              label={t("cddRiskTool.trialPeriodDays")}
              value={Number(form.trialPeriodDays)}
              onChange={(val) => setForm((current) => ({ ...current, trialPeriodDays: String(val) }))}
              min={0}
              max={90}
            />
          </div>
          <div className="sticky bottom-2 z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur">
            <button className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading} type="submit">
              {loading ? t("cddRiskTool.submitting") : t("cddRiskTool.submit")}
            </button>
          </div>
          {!usable ? (
            <p className="break-words text-xs text-[var(--ink-soft)]">
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="display-font break-words text-3xl font-semibold">
                {t("cddRiskTool.risk", { score: result.riskScore })}
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskUi(result.level).badge}`}>
                {getRiskUi(result.level).label}
              </span>
            </div>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">
              {t("cddRiskTool.level", { level: t(`cddRiskTool.${result.level}`) })}
            </p>
            <ul className="mt-4 space-y-2 break-words text-sm">
              {result.recommendationCodes.map((code) => (
                <li key={code} className="panel-strong rounded-xl p-3">{t(`cddRiskTool.reco_${code}`)}</li>
              ))}
            </ul>
            {result.issues.length > 0 ? (
              <div className="mt-4 space-y-2">
                {result.issues.map((issue) => (
                  <article key={issue.code} className="panel-strong rounded-xl p-3 text-sm">
                    <p className="font-semibold">
                      {issue.code} ({t(`cddRiskTool.${issue.severity}`)})
                    </p>
                    <p className="mt-1 text-[var(--ink-soft)]">{issue.message}</p>
                  </article>
                ))}
              </div>
            ) : null}
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
