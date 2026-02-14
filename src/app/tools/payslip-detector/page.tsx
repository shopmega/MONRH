"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

type Result = {
  riskScore: number;
  expected: {
    netSalary: number;
    cnssEmployee: number;
    incomeTax: number;
    smigEstimate: number;
  };
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
    expected?: number;
    reported?: number;
    gap?: number;
  }>;
};

export default function PayslipDetectorPage() {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({
    grossSalary: "9000",
    netSalaryReported: "7600",
    cnssEmployeeReported: "270",
    incomeTaxReported: "500",
    overtimePaidReported: "0",
    overtimeExpected: "0",
    calculationDate: "2026-02-12",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "payslip_detector");
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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/tools/payslip-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grossSalary: Number(form.grossSalary),
          netSalaryReported: Number(form.netSalaryReported),
          cnssEmployeeReported: Number(form.cnssEmployeeReported),
          incomeTaxReported: Number(form.incomeTaxReported),
          overtimePaidReported: Number(form.overtimePaidReported),
          overtimeExpected: Number(form.overtimeExpected),
          calculationDate: form.calculationDate,
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
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <p className="section-kicker">{t("payslipTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("payslipTool.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
            {t("payslipTool.description")}
          </p>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("payslipTool.grossSalary")}
            <input type="number" value={form.grossSalary} onChange={(event) => setForm((current) => ({ ...current, grossSalary: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("payslipTool.netReported")}
            <input type="number" value={form.netSalaryReported} onChange={(event) => setForm((current) => ({ ...current, netSalaryReported: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("payslipTool.cnssReported")}
            <input type="number" value={form.cnssEmployeeReported} onChange={(event) => setForm((current) => ({ ...current, cnssEmployeeReported: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("payslipTool.taxReported")}
            <input type="number" value={form.incomeTaxReported} onChange={(event) => setForm((current) => ({ ...current, incomeTaxReported: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("payslipTool.overtimePaid")}
            <input type="number" value={form.overtimePaidReported} onChange={(event) => setForm((current) => ({ ...current, overtimePaidReported: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("payslipTool.overtimeExpected")}
            <input type="number" value={form.overtimeExpected} onChange={(event) => setForm((current) => ({ ...current, overtimeExpected: event.target.value }))} className="input-shell mt-1" />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            {t("payslipTool.calculationDate")}
            <input type="date" value={form.calculationDate} onChange={(event) => setForm((current) => ({ ...current, calculationDate: event.target.value }))} className="input-shell mt-1" />
          </label>
          <button type="submit" className="btn-primary sm:col-span-2 px-4 py-2.5 text-sm" disabled={loading}>
            {loading ? t("payslipTool.submitting") : t("payslipTool.submit")}
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
            <p className="section-kicker">{t("payslipTool.result")}</p>
            <p className="display-font mt-2 break-words text-3xl font-semibold">{t("payslipTool.riskScore", { score: result.riskScore })}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="panel-strong rounded-xl p-3 text-sm break-words">{t("payslipTool.expectedNet", { amount: result.expected.netSalary.toLocaleString(locale) })}</div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">{t("payslipTool.expectedCnss", { amount: result.expected.cnssEmployee.toLocaleString(locale) })}</div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">{t("payslipTool.expectedTax", { amount: result.expected.incomeTax.toLocaleString(locale) })}</div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">{t("payslipTool.expectedSmig", { amount: result.expected.smigEstimate.toLocaleString(locale) })}</div>
            </div>
            <div className="mt-4 space-y-2">
              {result.issues.length === 0 ? (
                <p className="status-success rounded-xl px-3 py-2 text-sm">{t("payslipTool.noIssues")}</p>
              ) : (
                result.issues.map((issue) => (
                  <article key={issue.code} className="panel-strong min-w-0 rounded-xl p-3 text-sm">
                    <p className="break-words font-semibold">
                      {t(`payslipTool.issueLabel_${issue.code}`) === `payslipTool.issueLabel_${issue.code}`
                        ? issue.code
                        : t(`payslipTool.issueLabel_${issue.code}`)}{" "}
                      ({t(`payslipTool.${issue.severity}`)})
                    </p>
                    <p className="mt-1 break-words text-[var(--ink-soft)]">
                      {t(`payslipTool.issue_${issue.code}`) === `payslipTool.issue_${issue.code}`
                        ? issue.message
                        : t(`payslipTool.issue_${issue.code}`)}
                    </p>
                    <p className="mt-1 break-words text-xs text-[var(--ink-soft)]">
                      {t("payslipTool.issueLine", {
                        expected:
                          typeof issue.expected === "number" ? issue.expected.toLocaleString(locale) : "-",
                        reported:
                          typeof issue.reported === "number" ? issue.reported.toLocaleString(locale) : "-",
                        gap: typeof issue.gap === "number" ? issue.gap.toLocaleString(locale) : "-",
                      })}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
