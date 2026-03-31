/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type SuggestedCompanyRow = {
  id: string;
  userId: string;
  documentId: string | null;
  templateId: string;
  fieldId: string;
  companyName: string;
  createdAt: string;
};

/**
 * Insert one or more suggested companies (names entered by user when no Reviewly match was selected).
 * Use these records to add new businesses to the Avis/Reviewly API (e.g. admin job or API route).
 */
export async function addSuggestedCompanies(
  items: Array<{ userId: string; documentId?: string | null; templateId: string; fieldId: string; companyName: string }>,
): Promise<void> {
  if (items.length === 0) return;
  const supabase = getSupabaseAdminClient() as any;
  const rows = items.map((item) => ({
    user_id: item.userId,
    document_id: item.documentId ?? null,
    template_id: item.templateId,
    field_id: item.fieldId,
    company_name: item.companyName.trim(),
  }));
  const { error } = await supabase.from("suggested_companies").insert(rows);
  if (error) {
    console.error("[suggested_companies] insert failed", error);
    // Don't throw: document save should succeed even if suggestion storage fails
  }
}

export type ListSuggestedCompaniesOptions = {
  templateId?: string;
  since?: string; // ISO date
  limit?: number;
};

/**
 * List suggested companies (e.g. for admin export or sync to Avis API).
 * Uses service role so RLS does not block.
 */
export async function listSuggestedCompanies(
  options: ListSuggestedCompaniesOptions = {},
): Promise<SuggestedCompanyRow[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("suggested_companies")
    .select("id, user_id, document_id, template_id, field_id, company_name, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 500);
  if (options.templateId) query = query.eq("template_id", options.templateId);
  if (options.since) query = query.gte("created_at", options.since);
  const { data, error } = await query;
  if (error) throw new Error(error?.message ?? "suggested_companies_list_failed");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: String(row.user_id),
    documentId: row.document_id != null ? String(row.document_id) : null,
    templateId: String(row.template_id),
    fieldId: String(row.field_id),
    companyName: String(row.company_name),
    createdAt: String(row.created_at),
  }));
}
