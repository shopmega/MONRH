"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

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

        <form onSubmit={onSubmit} className="soft-card mt-5 space-y-3 rounded-3xl p-5">
          {Object.entries(form).map(([key, value]) => {
            const label = t(`complianceTool.${key}`);
            return (
              <label key={key} className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
                <span className="min-w-0 break-words">{label}</span>
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={value}
                  onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.checked }))}
                />
              </label>
            );
          })}
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
