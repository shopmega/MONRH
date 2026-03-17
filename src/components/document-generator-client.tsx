"use client";

import { useMemo, useRef, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { CompanySearchInput, type CompanyOption } from "@/components/company-search-input";
import { ReviewlyRatingBadge } from "@/components/reviewly-rating-badge";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/client";
import type { DocumentTemplate } from "@/lib/content/home-content";
import { buildDocumentPreview, toPreviewText } from "@/lib/documents/build-preview";
import { isCompanyField } from "@/lib/documents/company-fields";

function resolveInputType(field: DocumentTemplate["fields"][number]) {
  if (field.type) {
    return field.type;
  }

  if (field.placeholder === "YYYY-MM-DD") {
    return "date";
  }

  return "text";
}

export function DocumentGeneratorClient({
  template,
  initialValues = {},
}: {
  template: DocumentTemplate;
  initialValues?: Record<string, string>;
}) {
  const { t, locale } = useLanguage();
  const previewRef = useRef<HTMLElement | null>(null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      template.fields.map((field) => [field.id, initialValues[field.id] ?? ""]),
    ),
  );
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

  const reviewlyCompany = useMemo(() => {
    const companyField = template.fields.find(isCompanyField);
    if (!companyField) return null;
    const name = values[companyField.id]?.trim();
    const id = values[`${companyField.id}_reviewly_id`]?.trim();
    const ratingStr = values[`${companyField.id}_rating`]?.trim();
    const rating = ratingStr ? parseFloat(ratingStr) : NaN;
    if (!name || !id || Number.isNaN(rating)) return null;
    return { companyName: name, businessId: id, rating };
  }, [template.fields, values]);

  function ensureReady(): boolean {
    if (isReady) {
      setFormStatus(undefined);
      return true;
    }

    setFormStatus(`${t("documentGenerator.requiredPrefix")}: ${missingFields.map((field) => field.label).join(", ")}.`);
    return false;
  }

  function openPreview() {
    if (!ensureReady()) {
      return;
    }
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveDocument() {
    if (!ensureReady()) {
      return;
    }

    setSaveStatus(undefined);
    try {
      const response = await fetch("/api/documents/generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          templateTitle: template.title,
          values,
          preview: previewText,
        }),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      trackEvent({
        type: "document_generated",
        path: `/documents/${template.id}`,
        locale,
        meta: { templateId: template.id },
      });

      setSaveStatus(t("documentGenerator.saveSuccess"));
    } catch {
      setSaveStatus(t("documentGenerator.saveError"));
    }
  }

  async function copyDocument() {
    if (!ensureReady()) {
      return;
    }

    setCopyStatus(undefined);
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyStatus(t("documentGenerator.copySuccess"));
    } catch {
      setCopyStatus(t("documentGenerator.copyError"));
    }
  }

  function printDocument() {
    if (!ensureReady()) {
      return;
    }

    window.print();
  }

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <form className="soft-card min-w-0 rounded-3xl p-5">
        <h2 className="display-font break-words text-xl font-semibold">{t("documentGenerator.fieldsTitle")}</h2>
        <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
          {t("documentGenerator.completion")}: {previewData.completion.toLocaleString(locale)}%
        </p>
        <div className="mt-4 space-y-6">
          {template.fields.map((field) => {
            const hasError = missingFields.some((missingField) => missingField.id === field.id);
            if (isCompanyField(field)) {
              return (
                <CompanySearchInput
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  value={values[field.id] ?? ""}
                  placeholder={field.placeholder || "Rechercher une entreprise..."}
                  aria-invalid={hasError}
                  onChange={(value) => {
                    setFormStatus(undefined);
                    setSaveStatus(undefined);
                    setCopyStatus(undefined);
                    setValues((current) => ({ ...current, [field.id]: value }));
                  }}
                  onSelect={(company: CompanyOption) => {
                    setValues((current) => ({
                      ...current,
                      [field.id]: company.name,
                      [`${field.id}_reviewly_id`]: company.id,
                      [`${field.id}_rating`]: company.overall_rating != null ? String(company.overall_rating) : "",
                    }));
                  }}
                />
              );
            }
            return (
              <div key={field.id} className="space-y-3">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={resolveInputType(field)}
                  value={values[field.id] ?? ""}
                  onChange={(event) => {
                    setFormStatus(undefined);
                    setSaveStatus(undefined);
                    setCopyStatus(undefined);
                    setValues((current) => ({ ...current, [field.id]: event.target.value }));
                  }}
                  placeholder={field.placeholder}
                  required
                  aria-invalid={hasError}
                  error={hasError ? "Ce champ est requis" : undefined}
                />
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          onClick={openPreview}
          className="mt-6 w-full"
        >
          {t("documentGenerator.previewTitle")}
        </Button>
      </form>

      <article ref={previewRef} className="soft-card min-w-0 rounded-3xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="display-font break-words text-xl font-semibold">{t("documentGenerator.previewTitle")}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isReady ? "bg-[#e2efe9] text-[var(--accent)]" : "bg-[#fff0d9] text-[#8a5d13]"
              }`}
            >
              {isReady ? t("documentGenerator.ready") : t("documentGenerator.incomplete")}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <p className="mt-3 rounded-xl bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--foreground)] break-words">{formStatus}</p>
          ) : null}
          {saveStatus ? (
            <p className="status-success mt-3 rounded-xl px-3 py-2 text-sm">{saveStatus}</p>
          ) : null}
          {copyStatus ? (
            <p className="status-info mt-2 rounded-xl px-3 py-2 text-sm">{copyStatus}</p>
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

          <div className="mt-4">
            <p className="section-kicker">{t("common.partner")}</p>
            <div className="mt-2">
              <AdSlot slot="1717171717" format="auto" />
            </div>
          </div>

          {reviewlyCompany ? (
            <div className="mt-4">
              <ReviewlyRatingBadge
                companyName={reviewlyCompany.companyName}
                businessId={reviewlyCompany.businessId}
                rating={reviewlyCompany.rating}
              />
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
      </article>
    </section>
  );
}
