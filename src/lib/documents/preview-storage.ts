const PREFIX = "monrh-docgen-preview:";

export type DocgenPreviewPayload = {
  values: Record<string, string>;
  caseId?: string;
};

export function docgenPreviewStorageKey(templateId: string): string {
  return `${PREFIX}${templateId}`;
}

export function saveDocgenPreviewPayload(templateId: string, payload: DocgenPreviewPayload): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(docgenPreviewStorageKey(templateId), JSON.stringify(payload));
}

export function loadDocgenPreviewPayload(templateId: string): DocgenPreviewPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(docgenPreviewStorageKey(templateId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("values" in parsed)) return null;
    const values = (parsed as DocgenPreviewPayload).values;
    if (!values || typeof values !== "object") return null;
    const caseId = (parsed as DocgenPreviewPayload).caseId;
    return {
      values: values as Record<string, string>,
      caseId: typeof caseId === "string" ? caseId : undefined,
    };
  } catch {
    return null;
  }
}
