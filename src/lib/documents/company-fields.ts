/**
 * Shared logic to detect company/employer name fields and manage canonical company context
 * for document flows.
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
  "societe",
  "company name",
  "employer name",
];

const LEGACY_COMPANY_ID_SUFFIX = "_reviewly_id";
const CANONICAL_COMPANY_ID_SUFFIX = "_company_id";
const CANONICAL_COMPANY_SLUG_SUFFIX = "_company_slug";
const CANONICAL_COMPANY_RATING_SUFFIX = "_company_rating";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export type FieldLike = {
  id: string;
  label?: string;
  placeholder?: string;
  type?: string;
};

export type SavedCompanyContext = {
  companyId: string;
  slug: string | null;
  rating: number | null;
};

export type LinkedCompanyContext = SavedCompanyContext & {
  fieldId: string;
  companyName: string;
};

export type SelectedCompanyLike = {
  id: string;
  name: string;
  slug?: string | null;
  overall_rating: number | null;
};

export function isCompanyField(field: FieldLike): boolean {
  if (field.type === "company") return true;
  if (COMPANY_FIELD_IDS.includes(field.id as (typeof COMPANY_FIELD_IDS)[number])) return true;

  const label = normalize(field.label ?? "");
  if (COMPANY_FIELD_LABELS.some((candidate) => label === candidate || label.includes(candidate))) {
    return true;
  }

  const placeholder = normalize(field.placeholder ?? "");
  return (
    placeholder.includes("entreprise") ||
    placeholder.includes("employeur") ||
    placeholder.includes("company")
  );
}

export function getCompanyIdFieldKey(fieldId: string): string {
  return `${fieldId}${CANONICAL_COMPANY_ID_SUFFIX}`;
}

export function getCompanySlugFieldKey(fieldId: string): string {
  return `${fieldId}${CANONICAL_COMPANY_SLUG_SUFFIX}`;
}

export function getCompanyRatingFieldKey(fieldId: string): string {
  return `${fieldId}${CANONICAL_COMPANY_RATING_SUFFIX}`;
}

function getLegacyCompanyIdFieldKey(fieldId: string): string {
  return `${fieldId}${LEGACY_COMPANY_ID_SUFFIX}`;
}

export function getSavedCompanyContext(
  values: Record<string, string>,
  fieldId: string,
): SavedCompanyContext | null {
  const companyId = values[getCompanyIdFieldKey(fieldId)]?.trim() || values[getLegacyCompanyIdFieldKey(fieldId)]?.trim();
  const slug = values[getCompanySlugFieldKey(fieldId)]?.trim() || null;
  const ratingValue = values[getCompanyRatingFieldKey(fieldId)]?.trim() || values[`${fieldId}_rating`]?.trim();
  const rating = ratingValue ? Number.parseFloat(ratingValue) : Number.NaN;

  if (!companyId) {
    return null;
  }

  return {
    companyId,
    slug,
    rating: Number.isNaN(rating) ? null : rating,
  };
}

export function applySelectedCompany(
  values: Record<string, string>,
  fieldId: string,
  company: SelectedCompanyLike,
): Record<string, string> {
  return {
    ...values,
    [fieldId]: company.name,
    [getCompanyIdFieldKey(fieldId)]: company.id,
    [getCompanySlugFieldKey(fieldId)]: company.slug ?? "",
    [getCompanyRatingFieldKey(fieldId)]: company.overall_rating != null ? String(company.overall_rating) : "",
  };
}

export function applyResolvedCompanyContext(
  values: Record<string, string>,
  fieldId: string,
  match: {
    companyId: string;
    normalizedCompanySlug?: string | null;
  },
): Record<string, string> {
  return {
    ...values,
    [getCompanyIdFieldKey(fieldId)]: match.companyId,
    [getCompanySlugFieldKey(fieldId)]: match.normalizedCompanySlug ?? "",
  };
}

export function clearSelectedCompany(values: Record<string, string>, fieldId: string): Record<string, string> {
  return {
    ...values,
    [getCompanyIdFieldKey(fieldId)]: "",
    [getCompanySlugFieldKey(fieldId)]: "",
    [getCompanyRatingFieldKey(fieldId)]: "",
    [getLegacyCompanyIdFieldKey(fieldId)]: "",
    [`${fieldId}_rating`]: "",
  };
}

/**
 * From saved document values and template fields, returns company names that were
 * entered by the user but not linked to a canonical company id.
 */
export function getUnmatchedCompanyNames(
  fields: FieldLike[],
  values: Record<string, string>,
): { fieldId: string; companyName: string }[] {
  const out: { fieldId: string; companyName: string }[] = [];

  for (const field of fields) {
    if (!isCompanyField(field)) continue;

    const name = values[field.id]?.trim();
    const companyId = values[getCompanyIdFieldKey(field.id)]?.trim() || values[getLegacyCompanyIdFieldKey(field.id)]?.trim();

    if (name && !companyId) {
      out.push({ fieldId: field.id, companyName: name });
    }
  }

  return out;
}

export function getLinkedCompaniesFromValues(
  fields: FieldLike[],
  values: Record<string, string>,
): LinkedCompanyContext[] {
  const out: LinkedCompanyContext[] = [];

  for (const field of fields) {
    if (!isCompanyField(field)) continue;

    const companyName = values[field.id]?.trim();
    const context = getSavedCompanyContext(values, field.id);
    if (!companyName || !context?.companyId) continue;

    out.push({
      fieldId: field.id,
      companyName,
      companyId: context.companyId,
      slug: context.slug,
      rating: context.rating,
    });
  }

  return out;
}
