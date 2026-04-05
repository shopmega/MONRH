"use client";

import { useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { CompanyContextCard } from "@/components/company-context-card";
import { AvisineRatingBadge } from "@/components/avisine-rating-badge";
import { useLanguage } from "@/components/language-provider";
import { trackEvent } from "@/lib/analytics/client";
import type { DocumentTemplate } from "@/lib/content/home-content";
import { buildDocumentPreview, toPreviewText } from "@/lib/documents/build-preview";
import {
  applyResolvedCompanyContext,
  getSavedCompanyContext,
  getUnmatchedCompanyNames,
  isCompanyField,
} from "@/lib/documents/company-fields";
import { SITE_URL } from "@/lib/seo";

type DocumentPreviewPanelProps = {
  template: DocumentTemplate;
  values: Record<string, string>;
  caseId?: string;
};

export function DocumentPreviewPanel({ template, values, caseId }: DocumentPreviewPanelProps) {
  const { t, locale } = useLanguage();
  const [saveStatus, setSaveStatus] = useState<string>();
  const [copyStatus, setCopyStatus] = useState<string>();
  const [formStatus, setFormStatus] = useState<string>();
  const [previewMode, setPreviewMode] = useState<"letter" | "raw">("letter");

  const previewData = useMemo(
    () => buildDocumentPreview(template.id, template.title, values),
    [template.id, template.title, values],
  );
  const previewText = useMemo(
    () => toPreviewText(previewData, values),
    [previewData, values],
  );
  const missingFields = useMemo(
    () => template.fields.filter((field) => !String(values[field.id] ?? "").trim()),
    [template.fields, values],
  );
  const isReady = missingFields.length === 0;

  const companyInsight = useMemo(() => {
    const companyField = template.fields.find(isCompanyField);
    if (!companyField) return null;

    const name = values[companyField.id]?.trim();
    const companyContext = getSavedCompanyContext(values, companyField.id);
    if (!name || !companyContext?.companyId || companyContext.rating == null) return null;

    return { companyName: name, businessId: companyContext.companyId, rating: companyContext.rating };
  }, [template.fields, values]);

  function ensureReady(): boolean {
    if (isReady) {
      setFormStatus(undefined);
      return true;
    }
    setFormStatus(`${t("documentGenerator.requiredPrefix")}: ${missingFields.map((field) => field.label).join(", ")}.`);
    return false;
  }

  async function saveDocument() {
    if (!ensureReady()) return;

    setSaveStatus(undefined);
    try {
      const valuesForSave = await resolveCompanyValues(values);

      const response = await fetch("/api/documents/generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          templateTitle: template.title,
          values: valuesForSave,
          preview: previewText,
          caseId,
        }),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      const data = (await response.json()) as {
        evidenceArtifacts?: unknown[];
        verificationCandidates?: unknown[];
      };
      const evidenceCount = Array.isArray(data.evidenceArtifacts) ? data.evidenceArtifacts.length : 0;
      const verificationCount = Array.isArray(data.verificationCandidates) ? data.verificationCandidates.length : 0;

      trackEvent({
        type: "document_generated",
        path: `/documents/${template.id}/preview`,
        locale,
        meta: { templateId: template.id },
      });

      if (locale === "ar") {
        const suffix =
          verificationCount > 0 ?
            ` تم إنشاء ${verificationCount} عنصر تحقق و${evidenceCount} دليل مرتبط.`
          : evidenceCount > 0 ? ` تم إنشاء ${evidenceCount} دليل مرتبط.` : "";
        setSaveStatus(`${t("documentGenerator.saveSuccess")}${suffix}`);
      } else {
        const suffix =
          verificationCount > 0 ?
            ` ${verificationCount} verification(s) et ${evidenceCount} preuve(s) reliee(s) ont ete creees.`
          : evidenceCount > 0 ? ` ${evidenceCount} preuve(s) reliee(s) ont ete creees.` : "";
        setSaveStatus(`${t("documentGenerator.saveSuccess")}${suffix}`);
      }
    } catch {
      setSaveStatus(t("documentGenerator.saveError"));
    }
  }

  async function copyDocument() {
    if (!ensureReady()) return;

    setCopyStatus(undefined);
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyStatus(t("documentGenerator.copySuccess"));
    } catch {
      setCopyStatus(t("documentGenerator.copyError"));
    }
  }

  function printDocument() {
    if (!ensureReady()) return;
    window.print();
  }

  async function resolveCompanyValues(currentValues: Record<string, string>): Promise<Record<string, string>> {
    const unmatchedCompanies = getUnmatchedCompanyNames(template.fields, currentValues);
    if (unmatchedCompanies.length === 0) {
      return currentValues;
    }

    const results = await Promise.all(
      unmatchedCompanies.map(async (entry) => {
        try {
          const response = await fetch("/api/reviewly/companies/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName: entry.companyName }),
          });

          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as {
            companyId?: string | null;
            confidence?: "high" | "medium" | "low" | "none";
            normalizedCompanySlug?: string;
          };

          if (data.companyId && data.confidence === "high") {
            return {
              fieldId: entry.fieldId,
              companyId: data.companyId,
              normalizedCompanySlug: data.normalizedCompanySlug ?? "",
            };
          }

          return null;
        } catch {
          return null;
        }
      }),
    );

    const matchedCompanies = results.filter(
      (match): match is { fieldId: string; companyId: string; normalizedCompanySlug: string } => Boolean(match),
    );

    return matchedCompanies.reduce((nextValues, match) => {
      return applyResolvedCompanyContext(nextValues, match.fieldId, {
        companyId: match.companyId,
        normalizedCompanySlug: match.normalizedCompanySlug,
      });
    }, currentValues);
  }

  return (
    <article className="soft-card min-w-0 rounded-3xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="display-font break-words text-xl font-semibold">{t("documentGenerator.previewTitle")}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isReady
              ? "bg-[var(--success-bg)] text-[var(--success-ink)]"
              : "bg-[var(--info-bg)] text-[var(--info-ink)]"
          }`}
        >
          {isReady ? t("documentGenerator.ready") : t("documentGenerator.incomplete")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={printDocument}
          className="btn-primary px-4 py-2 text-xs uppercase tracking-wider"
        >
          {t("documentGenerator.print")}
        </button>
        <button
          type="button"
          onClick={copyDocument}
          className="btn-muted px-4 py-2 text-xs uppercase tracking-wider"
        >
          {t("documentGenerator.copy")}
        </button>
        <button
          type="button"
          onClick={saveDocument}
          className="btn-muted px-4 py-2 text-xs uppercase tracking-wider"
        >
          {t("documentGenerator.save")}
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] p-1">
          <button
            type="button"
            onClick={() => setPreviewMode("letter")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              previewMode === "letter" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--ink-soft)]"
            }`}
          >
            {t("documentGenerator.viewLetter")}
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("raw")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              previewMode === "raw" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--ink-soft)]"
            }`}
          >
            {t("documentGenerator.viewRaw")}
          </button>
        </div>
      </div>

      {formStatus ? (
        <p className="mt-3 break-words rounded-xl bg-[var(--info-bg)] px-3 py-2 text-sm text-[var(--info-ink)] print:hidden">
          {formStatus}
        </p>
      ) : null}
      {saveStatus ? (
        <p className="status-success mt-3 rounded-xl px-3 py-2 text-sm print:hidden">{saveStatus}</p>
      ) : null}
      {copyStatus ? (
        <p className="status-info mt-2 rounded-xl px-3 py-2 text-sm print:hidden">{copyStatus}</p>
      ) : null}

      {previewMode === "raw" ? (
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-[var(--surface-muted)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
          {previewText}
        </pre>
      ) : (
        <article className="letter-preview mt-4">
          {previewText.split("\n").map((line, index) =>
            line.trim().length === 0 ? (
              <div key={`line-${index}`} className="h-4" />
            ) : (
              <p key={`line-${index}`} className="leading-relaxed">
                {line}
              </p>
            ),
          )}
        </article>
      )}

      <div className="mt-4 print:hidden">
        <p className="section-kicker">{t("common.partner")}</p>
        <div className="mt-2">
          <AdSlot slot="1717171717" format="auto" />
        </div>
      </div>

      {companyInsight ? (
        <div className="mt-4 space-y-3 print:hidden">
          <AvisineRatingBadge rating={companyInsight.rating} />
          <CompanyContextCard companyId={companyInsight.businessId} companyName={companyInsight.companyName} />
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            {t("documentGenerator.attachments")}
          </p>
          <ul className="mt-2 list-disc space-y-1 break-words pl-5 text-sm text-[var(--foreground)]">
            {previewData.attachments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            {t("documentGenerator.nextSteps")}
          </p>
          <ul className="mt-2 list-disc space-y-1 break-words pl-5 text-sm text-[var(--foreground)]">
            {previewData.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-8 hidden text-center text-[10px] text-[var(--ink-soft)] print:block">
        {t("common.generatedOn")} {SITE_URL}
      </p>
    </article>
  );
}
