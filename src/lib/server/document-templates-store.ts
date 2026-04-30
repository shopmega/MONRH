/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DocumentTemplate } from "@/lib/content/home-content";
import { getPublicSupabaseAdminClient } from "@/lib/server/supabase-admin";

type ListTemplateOptions = {
  includeInactive?: boolean;
};

const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "resignation-letter",
    title: "Lettre de Demission",
    description: "Modele de demission avec preavis, date de depart et donnees contractuelles separees.",
    href: "/documents/resignation-letter",
    fields: [
      { id: "employeeName", label: "Nom complet du salarie", placeholder: "Nom et prenom" },
      { id: "employeeAddress", label: "Adresse du salarie", placeholder: "Adresse" },
      { id: "companyName", label: "Entreprise", placeholder: "Nom de l'entreprise", type: "company" },
      { id: "employerRepresentative", label: "Representant employeur", placeholder: "Nom du representant RH" },
      { id: "jobTitle", label: "Poste occupe", placeholder: "Intitule du poste" },
      { id: "workerCategory", label: "Categorie professionnelle", placeholder: "cadre, employe ou ouvrier" },
      { id: "contractType", label: "Type de contrat", placeholder: "CDI ou CDD" },
      { id: "hireDate", label: "Date d'embauche", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "noticeStartDate", label: "Date de notification", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "effectiveDepartureDate", label: "Date de depart effective", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "requestedNoticeWaiver", label: "Demande de dispense de preavis", placeholder: "Oui / Non / Accord amiable" },
      { id: "city", label: "Ville", placeholder: "Casablanca" },
    ],
  },
];

function normalizeTemplate(template: DocumentTemplate): DocumentTemplate {
  return {
    ...template,
    href: `/documents/${template.id}`,
  };
}

function mergeWithDefaultTemplates(templates: DocumentTemplate[]): DocumentTemplate[] {
  const existingIds = new Set(templates.map((template) => template.id));
  return [
    ...templates,
    ...DEFAULT_DOCUMENT_TEMPLATES.filter((template) => !existingIds.has(template.id)),
  ];
}

export async function listDocumentTemplates(): Promise<DocumentTemplate[]> {
  return listDocumentTemplatesWithOptions();
}

export async function listDocumentTemplatesWithOptions(
  options: ListTemplateOptions = {},
): Promise<DocumentTemplate[]> {
  const includeInactive = options.includeInactive ?? false;
  const supabase = getPublicSupabaseAdminClient() as any;
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
    console.error("[document-templates-store] listDocumentTemplates failed:", error?.message ?? "no data");
    return DEFAULT_DOCUMENT_TEMPLATES;
  }

  const templates = (data as Array<Record<string, unknown>>).map((row) =>
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
  return mergeWithDefaultTemplates(templates);
}

export async function getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined> {
  const templates = await listDocumentTemplatesWithOptions({ includeInactive: true });
  return templates.find((item) => item.id === id);
}
