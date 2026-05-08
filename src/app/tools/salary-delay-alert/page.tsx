"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import { PrintHeader, PrintFooter } from "@/components/print-layout";

type Result = {
  riskScore: number;
  level: "low" | "medium" | "high";
  legalSteps: string[];
  possiblePenalties: string[];
};

export default function SalaryDelayAlertPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    delayDays: "10",
    unpaidMonths: "0",
    repeatedDelaysLast6Months: "2",
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "salary_delay_alert");
  const userAuthenticated = config.userAuthenticated;
  const usable = canUseTool(toolPolicy, userAuthenticated);
  const checklist = [
    "Renseignez le retard moyen observe sur le dernier salaire.",
    "Indiquez le nombre de mois totalement impayes.",
    "Ajoutez les retards repetes des 6 derniers mois.",
  ];

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
      const response = await fetch("/api/tools/salary-delay-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delayDays: Number(form.delayDays),
          unpaidMonths: Number(form.unpaidMonths),
          repeatedDelaysLast6Months: Number(form.repeatedDelaysLast6Months),
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
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-24 sm:px-6 print:pt-0">
        <PrintHeader title={t("salaryDelayTool.title")} />
        <section className="soft-card rounded-[2rem] p-6 print:hidden">
          <p className="section-kicker">{t("salaryDelayTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("salaryDelayTool.title")}</h1>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Mesures</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Delais + recurrence</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Sortie</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Risque + recours</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Usage</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Plan pre-contentieux</p>
            </article>
          </div>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-3 print:hidden">
          <div className="panel-strong rounded-2xl p-4 sm:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Checklist avant alerte</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
              {checklist.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </div>
          <label className="min-w-0 rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("salaryDelayTool.delayDays")}
            <input className="input-shell mt-1" type="number" value={form.delayDays} onChange={(e) => setForm((c) => ({ ...c, delayDays: e.target.value }))} />
          </label>
          <label className="min-w-0 rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("salaryDelayTool.unpaidMonths")}
            <input className="input-shell mt-1" type="number" value={form.unpaidMonths} onChange={(e) => setForm((c) => ({ ...c, unpaidMonths: e.target.value }))} />
          </label>
          <label className="min-w-0 rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("salaryDelayTool.repeatedDelays")}
            <input className="input-shell mt-1" type="number" value={form.repeatedDelaysLast6Months} onChange={(e) => setForm((c) => ({ ...c, repeatedDelaysLast6Months: e.target.value }))} />
          </label>
          <div className="sticky bottom-2 z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur sm:col-span-3">
            <button className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading} type="submit">
              {loading ? t("salaryDelayTool.submitting") : t("salaryDelayTool.submit")}
            </button>
          </div>
          {!usable ? (
            <p className="sm:col-span-3 break-words text-xs text-[var(--ink-soft)]">
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
              <p className="display-font break-words text-3xl font-semibold">{t("salaryDelayTool.risk", { score: result.riskScore, level: t(`salaryDelayTool.${result.level}`) })}</p>
              <div className="flex gap-2 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="btn-muted px-4 py-1.5 text-xs font-semibold"
                >
                  Imprimer
                </button>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskUi(result.level).badge}`}>
                  {getRiskUi(result.level).label}
                </span>
              </div>
              <span className={`print-only rounded-full px-3 py-1 text-xs font-semibold ${getRiskUi(result.level).badge}`}>
                {getRiskUi(result.level).label}
              </span>
            </div>
            <h2 className="mt-4 font-semibold">{t("salaryDelayTool.legalSteps")}</h2>
            <div className="mt-2 grid gap-2">
              {(result.legalSteps.length > 0
                ? result.legalSteps
                : [
                    t("salaryDelayTool.step1"),
                    t("salaryDelayTool.step2"),
                    t("salaryDelayTool.step3"),
                    t("salaryDelayTool.step4"),
                  ]
              ).map((step, index) => (
                <article key={`legal-step-${index}`} className="panel-strong rounded-xl p-3 text-sm break-words">
                  {step}
                </article>
              ))}
            </div>
            <h2 className="mt-4 font-semibold">{t("salaryDelayTool.penalties")}</h2>
            <div className="mt-2 grid gap-2">
              {(result.possiblePenalties.length > 0
                ? result.possiblePenalties
                : [t("salaryDelayTool.penalty1"), t("salaryDelayTool.penalty2"), t("salaryDelayTool.penalty3")]
              ).map((penalty, index) => (
                <article key={`penalty-${index}`} className="panel-strong rounded-xl p-3 text-sm break-words">
                  {penalty}
                </article>
              ))}
            </div>
            <PrintFooter />
          </section>
        ) : null}
      </div>
    </main>
  );
}
