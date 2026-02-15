"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

type Result = {
  versionCode: string;
  riskScore: number;
  level: "low" | "medium" | "high";
  breakdown: {
    totalServiceYears: number;
    indemnityLegale: number;
    indemnitePreavis: number;
    congesPayesRestants: number;
    salaryArrears: number;
    overtimeArrears: number;
    dommagesAbusif: number;
    totalEstimatedDue: number;
  };
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
    amount?: number;
  }>;
};

export default function FinalSettlementAuditPage() {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({
    calculationDate: "2026-02-12",
    monthlySalary: "9000",
    contractType: "CDI",
    workerCategory: "employe",
    yearsOfService: "4",
    monthsOfService: "0",
    unusedLeaveDays: "10",
    unpaidSalaryMonths: "0",
    overtimeDueMad: "0",
    noticeAlreadyPaid: false,
    abusiveDismissal: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "final_settlement_audit");
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
      const response = await fetch("/api/tools/final-settlement-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculationDate: form.calculationDate,
          monthlySalary: Number(form.monthlySalary),
          contractType: form.contractType,
          workerCategory: form.workerCategory,
          yearsOfService: Number(form.yearsOfService),
          monthsOfService: Number(form.monthsOfService),
          unusedLeaveDays: Number(form.unusedLeaveDays),
          unpaidSalaryMonths: Number(form.unpaidSalaryMonths),
          overtimeDueMad: Number(form.overtimeDueMad),
          noticeAlreadyPaid: form.noticeAlreadyPaid,
          abusiveDismissal: form.abusiveDismissal,
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
          <p className="section-kicker">{t("finalSettlementTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">
            {t("finalSettlementTool.title")}
          </h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
            {t("finalSettlementTool.description")}
          </p>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.monthlySalary")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.monthlySalary}
              onChange={(event) =>
                setForm((current) => ({ ...current, monthlySalary: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.calculationDate")}
            <input
              type="date"
              className="input-shell mt-1"
              value={form.calculationDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, calculationDate: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.contractType")}
            <select
              className="input-shell mt-1"
              value={form.contractType}
              onChange={(event) =>
                setForm((current) => ({ ...current, contractType: event.target.value }))
              }
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.workerCategory")}
            <select
              className="input-shell mt-1"
              value={form.workerCategory}
              onChange={(event) =>
                setForm((current) => ({ ...current, workerCategory: event.target.value }))
              }
            >
              <option value="cadre">{t("finalSettlementTool.categoryCadre")}</option>
              <option value="employe">{t("finalSettlementTool.categoryEmploye")}</option>
              <option value="ouvrier">{t("finalSettlementTool.categoryOuvrier")}</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.yearsOfService")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.yearsOfService}
              onChange={(event) =>
                setForm((current) => ({ ...current, yearsOfService: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.monthsOfService")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.monthsOfService}
              onChange={(event) =>
                setForm((current) => ({ ...current, monthsOfService: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.unusedLeaveDays")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.unusedLeaveDays}
              onChange={(event) =>
                setForm((current) => ({ ...current, unusedLeaveDays: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.unpaidSalaryMonths")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.unpaidSalaryMonths}
              onChange={(event) =>
                setForm((current) => ({ ...current, unpaidSalaryMonths: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("finalSettlementTool.overtimeDue")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.overtimeDueMad}
              onChange={(event) =>
                setForm((current) => ({ ...current, overtimeDueMad: event.target.value }))
              }
            />
          </label>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
              <input
                type="checkbox"
                checked={form.noticeAlreadyPaid}
                onChange={(event) =>
                  setForm((current) => ({ ...current, noticeAlreadyPaid: event.target.checked }))
                }
              />
              {t("finalSettlementTool.noticeAlreadyPaid")}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
              <input
                type="checkbox"
                checked={form.abusiveDismissal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, abusiveDismissal: event.target.checked }))
                }
              />
              {t("finalSettlementTool.abusiveDismissal")}
            </label>
          </div>
          <button type="submit" className="btn-primary sm:col-span-2 px-4 py-2.5 text-sm" disabled={loading}>
            {loading ? t("finalSettlementTool.submitting") : t("finalSettlementTool.submit")}
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
            <p className="section-kicker">{t("finalSettlementTool.result")}</p>
            <p className="display-font mt-2 break-words text-3xl font-semibold">
              {t("finalSettlementTool.estimatedDue", {
                amount: result.breakdown.totalEstimatedDue.toLocaleString(locale),
              })}
            </p>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">
              {t("finalSettlementTool.riskLevel", {
                score: result.riskScore,
                level: t(`finalSettlementTool.${result.level}`),
              })}{" "}
              | {t("common.legalVersion")}: {result.versionCode}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.indemnityLegale", {
                  amount: result.breakdown.indemnityLegale.toLocaleString(locale),
                })}
              </div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.preavis", {
                  amount: result.breakdown.indemnitePreavis.toLocaleString(locale),
                })}
              </div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.leaveBalance", {
                  amount: result.breakdown.congesPayesRestants.toLocaleString(locale),
                })}
              </div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.salaryArrears", {
                  amount: result.breakdown.salaryArrears.toLocaleString(locale),
                })}
              </div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.overtimeArrears", {
                  amount: result.breakdown.overtimeArrears.toLocaleString(locale),
                })}
              </div>
              <div className="panel-strong rounded-xl p-3 text-sm break-words">
                {t("finalSettlementTool.abusiveDamages", {
                  amount: result.breakdown.dommagesAbusif.toLocaleString(locale),
                })}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {result.issues.length === 0 ? (
                <p className="status-success rounded-xl px-3 py-2 text-sm">
                  {t("finalSettlementTool.noIssues")}
                </p>
              ) : (
                result.issues.map((issue) => (
                  <article key={issue.code} className="panel-strong min-w-0 rounded-xl p-3 text-sm">
                    <p className="break-words font-semibold">
                      {t(`finalSettlementTool.issueLabel_${issue.code}`) ===
                      `finalSettlementTool.issueLabel_${issue.code}`
                        ? issue.code
                        : t(`finalSettlementTool.issueLabel_${issue.code}`)}{" "}
                      ({t(`finalSettlementTool.${issue.severity}`)})
                    </p>
                    <p className="mt-1 break-words text-[var(--ink-soft)]">
                      {t(`finalSettlementTool.issue_${issue.code}`) ===
                      `finalSettlementTool.issue_${issue.code}`
                        ? issue.message
                        : t(`finalSettlementTool.issue_${issue.code}`)}
                    </p>
                    {typeof issue.amount === "number" ? (
                      <p className="mt-1 break-words text-xs text-[var(--ink-soft)]">
                        {t("finalSettlementTool.issueAmount", {
                          amount: issue.amount.toLocaleString(locale),
                        })}
                      </p>
                    ) : null}
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
