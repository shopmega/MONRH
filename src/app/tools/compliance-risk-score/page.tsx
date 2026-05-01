"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import { SmartToggle } from "@/components/ui/smart-inputs";
import { PrintHeader, PrintFooter } from "@/components/print-layout";

type Result = {
  riskScore: number;
  level: "low" | "medium" | "high";
  recommendationCodes: string[];
};

export default function ComplianceRiskScorePage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    hasWrittenContract: false,
    declaredToCnss: false,
    receivesPayslip: true,
    paidOvertimeWhenApplicable: false,
    paidOnTime: false,
    hasProofArchive: false,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "compliance_risk_score");
  const userAuthenticated = config.userAuthenticated;
  const usable = canUseTool(toolPolicy, userAuthenticated);
  const checklist = [
    "Confirmez les informations contractuelles.",
    "Controlez les preuves administratives disponibles.",
    "Validez chaque point avant de lancer le score.",
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
      const response = await fetch("/api/tools/compliance-risk-score", {
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
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-24 sm:px-6 print:pt-0">
        <PrintHeader title={t("complianceTool.title")} />
        <section className="soft-card rounded-[2rem] p-6 print:hidden">
          <p className="section-kicker">{t("complianceTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("complianceTool.title")}</h1>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Points de controle</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">6</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Sortie</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Score + Recos</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Niveau</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Low / Medium / High</p>
            </article>
          </div>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 space-y-6 rounded-3xl p-5 sm:p-7 print:hidden">
          <div className="panel-strong rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Checklist avant score</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
              {checklist.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4">
            {Object.entries(form).map(([key, value]) => {
              const label = t(`complianceTool.${key}`);
              // Using a mapping for subtitles based on Moroccan HR context
              const subtitles: Record<string, string> = {
                hasWrittenContract: "Contrat signé par les deux parties",
                declaredToCnss: "Bordereau de déclaration mensuelle",
                receivesPayslip: "Bulletin de paie conforme au salaire",
                paidOvertimeWhenApplicable: "Majoration 25%, 50% ou 100%",
                paidOnTime: "Respect du délai de paiement (art. 354 CGI)",
                hasProofArchive: "Documents archivés pendant 10 ans",
              };
              
              return (
                <div key={key} className="rounded-2xl bg-[var(--surface-elevated)] p-2">
                  <SmartToggle
                    label={label}
                    value={value}
                    onChange={(checked) => setForm((c) => ({ ...c, [key]: checked }))}
                    subtitle={subtitles[key]}
                  />
                </div>
              );
            })}
          </div>
          <div className="sticky bottom-2 z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur">
            <button className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading} type="submit">
              {loading ? t("complianceTool.submitting") : t("complianceTool.submit")}
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
              <p className="display-font break-words text-3xl font-semibold">{t("complianceTool.risk", { score: result.riskScore })}</p>
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
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">{t("complianceTool.level", { level: t(`complianceTool.${result.level}`) })}</p>
            <ul className="mt-4 space-y-2 break-words text-sm">
              {result.recommendationCodes.map((code) => (
                <li key={code} className="panel-strong rounded-xl p-3">{t(`complianceTool.reco_${code}`)}</li>
              ))}
            </ul>
            <PrintFooter />
          </section>
        ) : null}
      </div>
    </main>
  );
}
