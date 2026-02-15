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
  recommendationCodes: string[];
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export default function DisciplinaryProcedureCheckPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    hasWrittenNotice: true,
    noticeDescribesFacts: true,
    hearingHeld: true,
    hearingNoticeHours: "48",
    employeeCanDefend: true,
    sanctionWithinReasonableDelay: true,
    priorSanctionsDocumented: true,
    hasProofArchive: true,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, "disciplinary_procedure_check");
  const userAuthenticated = config.userAuthenticated;
  const usable = canUseTool(toolPolicy, userAuthenticated);
  const relatedDocs = result
    ? buildToolResultDocumentLinks({
        toolId: "disciplinary_procedure_check",
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
      const response = await fetch("/api/tools/disciplinary-procedure-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hearingNoticeHours: Number(form.hearingNoticeHours),
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
          <p className="section-kicker">{t("disciplineTool.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold">{t("disciplineTool.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("disciplineTool.description")}</p>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 space-y-3 rounded-3xl p-5">
          {[
            "hasWrittenNotice",
            "noticeDescribesFacts",
            "hearingHeld",
            "employeeCanDefend",
            "sanctionWithinReasonableDelay",
            "priorSanctionsDocumented",
            "hasProofArchive",
          ].map((key) => (
            <label key={key} className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-sm">
              <span className="min-w-0 break-words">{t(`disciplineTool.${key}`)}</span>
              <input
                type="checkbox"
                className="mt-0.5 shrink-0"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
            </label>
          ))}
          <label className="block text-sm font-semibold">
            {t("disciplineTool.hearingNoticeHours")}
            <input
              className="input-shell mt-1"
              type="number"
              value={form.hearingNoticeHours}
              onChange={(event) =>
                setForm((current) => ({ ...current, hearingNoticeHours: event.target.value }))
              }
            />
          </label>
          <button className="btn-primary w-full px-4 py-2.5 text-sm" disabled={loading} type="submit">
            {loading ? t("disciplineTool.submitting") : t("disciplineTool.submit")}
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
            <p className="display-font break-words text-3xl font-semibold">
              {t("disciplineTool.risk", { score: result.riskScore })}
            </p>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">
              {t("disciplineTool.level", { level: t(`disciplineTool.${result.level}`) })}
            </p>
            <ul className="mt-4 list-disc space-y-1 break-words pl-5 text-sm">
              {result.recommendationCodes.map((code) => (
                <li key={code}>{t(`disciplineTool.reco_${code}`)}</li>
              ))}
            </ul>
            {relatedDocs.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                <p className="section-kicker">{t("simulator.relatedDocumentsTitle")}</p>
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
