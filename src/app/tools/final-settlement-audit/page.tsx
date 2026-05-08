"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { SmartToggle } from "@/components/ui/smart-inputs";
import { buildToolResultDocumentLinks } from "@/lib/tools/result-document-links";
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

function getCurrentDateISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function FinalSettlementAuditPage() {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({
    monthlySalary: "",
    contractType: "",
    workerCategory: "",
    hireDate: "",
    unusedLeaveDays: "",
    unpaidSalaryMonths: "",
    overtimeDueMad: "",
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
  const relatedModelsLabel = t("toolsPage.relatedDocuments");
  const checklist = [
    "Confirmez salaire, anciennete et type de contrat.",
    "Renseignez les soldes restants (conges, salaires, heures).",
    "Validez le contexte de rupture avant calcul final.",
  ];
  const relatedDocs = result
    ? buildToolResultDocumentLinks({
        toolId: "final_settlement_audit",
        result,
      })
    : [];

  function getRiskUi(level: Result["level"]) {
    if (level === "high") return { badge: "bg-[#fde8e8] text-[#b42318]" };
    if (level === "medium") return { badge: "bg-[#fff4e5] text-[#b54708]" };
    return { badge: "bg-[#e8f6ed] text-[#067647]" };
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

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/tools/final-settlement-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculationDate: getCurrentDateISO(),
          monthlySalary: Number(form.monthlySalary),
          contractType: form.contractType,
          workerCategory: form.workerCategory,
          hireDate: form.hireDate,
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
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Sortie</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Montant global estime</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Audit</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Conformite des composantes</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Actions</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Modeles de recours</p>
            </article>
          </div>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <div className="panel-strong rounded-2xl p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Checklist avant audit</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
              {checklist.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </div>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.monthlySalary")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.monthlySalary}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, monthlySalary: event.target.value }))
              }
            />
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.contractType")}
            <select
              className="input-shell mt-1"
              value={form.contractType}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, contractType: event.target.value }))
              }
            >
              <option value="" disabled>Selectionner</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
            </select>
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.workerCategory")}
            <select
              className="input-shell mt-1"
              value={form.workerCategory}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, workerCategory: event.target.value }))
              }
            >
              <option value="" disabled>Selectionner</option>
              <option value="cadre">{t("finalSettlementTool.categoryCadre")}</option>
              <option value="employe">{t("finalSettlementTool.categoryEmploye")}</option>
              <option value="ouvrier">{t("finalSettlementTool.categoryOuvrier")}</option>
            </select>
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            Date d&apos;embauche
            <input
              type="date"
              className="input-shell mt-1"
              value={form.hireDate}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, hireDate: event.target.value }))
              }
            />
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.unusedLeaveDays")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.unusedLeaveDays}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, unusedLeaveDays: event.target.value }))
              }
            />
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.unpaidSalaryMonths")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.unpaidSalaryMonths}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, unpaidSalaryMonths: event.target.value }))
              }
            />
          </label>
          <label className="block rounded-2xl bg-[var(--surface-elevated)] p-3 text-sm font-semibold">
            {t("finalSettlementTool.overtimeDue")}
            <input
              type="number"
              className="input-shell mt-1"
              value={form.overtimeDueMad}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, overtimeDueMad: event.target.value }))
              }
            />
          </label>
          <div className="grid gap-2">
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-2">
              <SmartToggle
                label={t("finalSettlementTool.noticeAlreadyPaid")}
                value={form.noticeAlreadyPaid}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, noticeAlreadyPaid: checked }))
                }
              />
            </div>
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-2">
              <SmartToggle
                label={t("finalSettlementTool.abusiveDismissal")}
                value={form.abusiveDismissal}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, abusiveDismissal: checked }))
                }
              />
            </div>
          </div>
          <div className="sticky bottom-2 z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur sm:col-span-2">
            <button type="submit" className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading}>
              {loading ? t("finalSettlementTool.submitting") : t("finalSettlementTool.submit")}
            </button>
          </div>
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
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="display-font break-words text-3xl font-semibold">
                {t("finalSettlementTool.estimatedDue", {
                  amount: result.breakdown.totalEstimatedDue.toLocaleString(locale),
                })}
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskUi(result.level).badge}`}>
                {t(`finalSettlementTool.${result.level}`)}
              </span>
            </div>
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
