"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

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
    const response = await fetch("/api/tools/salary-delay-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delayDays: Number(form.delayDays),
        unpaidMonths: Number(form.unpaidMonths),
        repeatedDelaysLast6Months: Number(form.repeatedDelaysLast6Months),
      }),
    });
    const data = (await response.json()) as { ok: boolean; result?: Result };
    if (data.ok && data.result) setResult(data.result);
    setLoading(false);
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <p className="section-kicker">{t("salaryDelayTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("salaryDelayTool.title")}</h1>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-3">
          <label className="min-w-0 text-sm font-semibold">
            {t("salaryDelayTool.delayDays")}
            <input className="input-shell mt-1" type="number" value={form.delayDays} onChange={(e) => setForm((c) => ({ ...c, delayDays: e.target.value }))} />
          </label>
          <label className="min-w-0 text-sm font-semibold">
            {t("salaryDelayTool.unpaidMonths")}
            <input className="input-shell mt-1" type="number" value={form.unpaidMonths} onChange={(e) => setForm((c) => ({ ...c, unpaidMonths: e.target.value }))} />
          </label>
          <label className="min-w-0 text-sm font-semibold">
            {t("salaryDelayTool.repeatedDelays")}
            <input className="input-shell mt-1" type="number" value={form.repeatedDelaysLast6Months} onChange={(e) => setForm((c) => ({ ...c, repeatedDelaysLast6Months: e.target.value }))} />
          </label>
          <button className="btn-primary sm:col-span-3 px-4 py-2.5 text-sm" disabled={loading} type="submit">
            {loading ? t("salaryDelayTool.submitting") : t("salaryDelayTool.submit")}
          </button>
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
            <p className="display-font break-words text-3xl font-semibold">{t("salaryDelayTool.risk", { score: result.riskScore, level: t(`salaryDelayTool.${result.level}`) })}</p>
            <h2 className="mt-4 font-semibold">{t("salaryDelayTool.legalSteps")}</h2>
            <ul className="mt-2 list-disc space-y-1 break-words pl-5 text-sm">
              <li>{t("salaryDelayTool.step1")}</li>
              <li>{t("salaryDelayTool.step2")}</li>
              <li>{t("salaryDelayTool.step3")}</li>
              <li>{t("salaryDelayTool.step4")}</li>
            </ul>
            <h2 className="mt-4 font-semibold">{t("salaryDelayTool.penalties")}</h2>
            <ul className="mt-2 list-disc space-y-1 break-words pl-5 text-sm">
              <li>{t("salaryDelayTool.penalty1")}</li>
              <li>{t("salaryDelayTool.penalty2")}</li>
              <li>{t("salaryDelayTool.penalty3")}</li>
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
