"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import { SmartToggle } from "@/components/ui/smart-inputs";

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
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <p className="section-kicker">{t("complianceTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("complianceTool.title")}</h1>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 space-y-6 rounded-3xl p-5 sm:p-7">
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
                <SmartToggle
                  key={key}
                  label={label}
                  value={value}
                  onChange={(checked) => setForm((c) => ({ ...c, [key]: checked }))}
                  subtitle={subtitles[key]}
                />
              );
            })}
          </div>
          <button className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading} type="submit">
            {loading ? t("complianceTool.submitting") : t("complianceTool.submit")}
          </button>
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
            <p className="display-font break-words text-3xl font-semibold">{t("complianceTool.risk", { score: result.riskScore })}</p>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">{t("complianceTool.level", { level: t(`complianceTool.${result.level}`) })}</p>
            <ul className="mt-4 list-disc space-y-1 break-words pl-5 text-sm">
              {result.recommendationCodes.map((code) => <li key={code}>{t(`complianceTool.reco_${code}`)}</li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
