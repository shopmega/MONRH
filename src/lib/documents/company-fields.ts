/**
 * Shared logic to detect company/employer name fields (for autosearch and suggested companies).
 * Used by document generator client and API routes.
 */

export const COMPANY_FIELD_IDS = [
  "company_name",
  "companyName",
  "employer_name",
  "employerName",
] as const;

const COMPANY_FIELD_LABELS = [
  "nom d'entreprise",
  "nom de l'entreprise",
  "nom entreprise",
  "employeur",
  "entreprise",
  "raison sociale",
  "société",
  "company name",
  "employer name",
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export type FieldLike = {
  id: string;
  label?: string;
  placeholder?: string;
  type?: string;
};

export function isCompanyField(field: FieldLike): boolean {
  if (field.type === "company") return true;
  if (COMPANY_FIELD_IDS.includes(field.id as (typeof COMPANY_FIELD_IDS)[number]))
    return true;
  const label = normalize(field.label ?? "");
  if (COMPANY_FIELD_LABELS.some((l) => label === l || label.includes(l))) return true;
  const placeholder = normalize(field.placeholder ?? "");
  if (
    placeholder.includes("entreprise") ||
    placeholder.includes("employeur") ||
    placeholder.includes("company")
  )
    return true;
  return false;
}

/**
 * From saved document values and template fields, returns company names that were
 * entered by the user but not selected from Reviewly (no reviewly_id).
 */
export function getUnmatchedCompanyNames(
  fields: FieldLike[],
  values: Record<string, string>,
): { fieldId: string; companyName: string }[] {
  const out: { fieldId: string; companyName: string }[] = [];
  for (const field of fields) {
    if (!isCompanyField(field)) continue;
    const name = values[field.id]?.trim();
    const reviewlyId = values[`${field.id}_reviewly_id`]?.trim();
    if (name && !reviewlyId) out.push({ fieldId: field.id, companyName: name });
  }
  return out;
}
