"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { DocumentPreviewPanel } from "@/components/document-preview-panel";
import type { DocumentTemplate } from "@/lib/content/home-content";
import { loadDocgenPreviewPayload } from "@/lib/documents/preview-storage";

export function DocumentPreviewPageClient({ template }: { template: DocumentTemplate }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [caseId, setCaseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loaded = loadDocgenPreviewPayload(template.id);
    if (!loaded) {
      router.replace(`/documents/${template.id}`);
      return;
    }
    setValues(loaded.values);
    setCaseId(loaded.caseId);
  }, [template.id, router]);

  if (values === null) {
    return (
      <div className="soft-card mt-5 rounded-3xl p-8 text-center text-sm text-[var(--ink-soft)]">
        {t("documentGenerator.previewLoading")}
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/documents/${template.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          <span aria-hidden>←</span>
          {t("documentGenerator.editFields")}
        </Link>
      </div>
      <div className="mt-5">
        <DocumentPreviewPanel template={template} values={values} caseId={caseId} />
      </div>
    </>
  );
}
