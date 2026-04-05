"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanySearchInput, type CompanyOption } from "@/components/company-search-input";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DocumentTemplate } from "@/lib/content/home-content";
import { buildDocumentPreview } from "@/lib/documents/build-preview";
import {
  applySelectedCompany,
  clearSelectedCompany,
  isCompanyField,
} from "@/lib/documents/company-fields";
import { saveDocgenPreviewPayload } from "@/lib/documents/preview-storage";

function resolveInputType(field: DocumentTemplate["fields"][number]) {
  if (field.type) {
    return field.type;
  }
  if (field.placeholder === "YYYY-MM-DD") {
    return "date";
  }
  return "text";
}

export function DocumentGeneratorFormClient({
  template,
  initialValues = {},
  caseId,
}: {
  template: DocumentTemplate;
  initialValues?: Record<string, string>;
  caseId?: string;
}) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    () => ({
      ...initialValues,
      ...Object.fromEntries(template.fields.map((field) => [field.id, initialValues[field.id] ?? ""])),
    }),
  );
  const [formStatus, setFormStatus] = useState<string>();

  const previewData = useMemo(
    () => buildDocumentPreview(template.id, template.title, values),
    [template.id, template.title, values],
  );

  const missingFields = useMemo(
    () => template.fields.filter((field) => !String(values[field.id] ?? "").trim()),
    [template.fields, values],
  );
  const isReady = missingFields.length === 0;

  function goToPreview() {
    if (!isReady) {
      setFormStatus(`${t("documentGenerator.requiredPrefix")}: ${missingFields.map((field) => field.label).join(", ")}.`);
      return;
    }
    setFormStatus(undefined);
    saveDocgenPreviewPayload(template.id, { values, caseId });
    router.push(`/documents/${template.id}/preview`);
  }

  return (
    <section className="mt-5 print:hidden">
      <form
        className="soft-card min-w-0 rounded-3xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          goToPreview();
        }}
      >
        <h2 className="display-font break-words text-xl font-semibold">{t("documentGenerator.fieldsTitle")}</h2>
        <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
          {t("documentGenerator.completion")}: {previewData.completion.toLocaleString(locale)}%
        </p>
        <div className="mt-4 space-y-6">
          {template.fields.map((field) => {
            const hasError = missingFields.some((missingField) => missingField.id === field.id);
            const showError = Boolean(formStatus && hasError);

            if (isCompanyField(field)) {
              return (
                <CompanySearchInput
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  value={values[field.id] ?? ""}
                  placeholder={field.placeholder || "Rechercher une entreprise..."}
                  aria-invalid={showError}
                  onChange={(value) => {
                    setFormStatus(undefined);
                    setValues((current) => {
                      const next = { ...current, [field.id]: value };
                      return clearSelectedCompany(next, field.id);
                    });
                  }}
                  onSelect={(company: CompanyOption) => {
                    setValues((current) => applySelectedCompany(current, field.id, company));
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
                    setValues((current) => ({ ...current, [field.id]: event.target.value }));
                  }}
                  placeholder={field.placeholder}
                  required
                  aria-invalid={showError}
                  error={showError ? "Ce champ est requis" : undefined}
                />
              </div>
            );
          })}
        </div>

        {formStatus ? (
          <p className="mt-4 rounded-xl bg-[var(--info-bg)] px-3 py-2 text-sm text-[var(--info-ink)] break-words">
            {formStatus}
          </p>
        ) : null}

        <p className="mt-4 text-xs text-[var(--ink-soft)]">{t("documentGenerator.previewHint")}</p>

        <Button type="submit" className="mt-4 w-full">
          {t("documentGenerator.continueToPreview")}
        </Button>
      </form>
    </section>
  );
}
