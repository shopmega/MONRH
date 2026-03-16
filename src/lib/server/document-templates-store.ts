/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DocumentTemplate } from "@/lib/content/home-content";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

type ListTemplateOptions = {
  includeInactive?: boolean;
};

function normalizeTemplate(template: DocumentTemplate): DocumentTemplate {
  return {
    ...template,
    href: `/documents/${template.id}`,
  };
}

export async function listDocumentTemplates(): Promise<DocumentTemplate[]> {
  return listDocumentTemplatesWithOptions();
}

export async function listDocumentTemplatesWithOptions(
  options: ListTemplateOptions = {},
): Promise<DocumentTemplate[]> {
  const includeInactive = options.includeInactive ?? false;
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("document_templates")
    .select("id, title, description, fields, is_active")
    .order("title", { ascending: true })
    .limit(500);
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "document_templates_list_failed");
  }

  return (data as Array<Record<string, unknown>>).map((row) =>
    normalizeTemplate({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      fields: Array.isArray(row.fields)
        ? row.fields.map((field) => {
            const item = (field ?? {}) as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              label: String(item.label ?? ""),
              placeholder: String(item.placeholder ?? ""),
              type:
                item.type === "date" || item.type === "datetime-local" || item.type === "text" || item.type === "company"
                  ? item.type
                  : undefined,
            };
          })
        : [],
      href: `/documents/${String(row.id)}`,
    }),
  );
}

export async function getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined> {
  const templates = await listDocumentTemplatesWithOptions({ includeInactive: true });
  return templates.find((item) => item.id === id);
}
