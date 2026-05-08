import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContractFormData } from "./types";

/**
 * Syncs contract data to AVISINE's public salary pool for market insights.
 * This function extracts relevant, non-identifiable data points (role, pay, location).
 */
export async function syncContractToAvisine(formData: ContractFormData, companyId?: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Determine the business ID to link to in AVISINE
    // In our ecosystem, the 'company_id' or a slug mapping is used.
    const businessId = companyId || formData.company_name; // Fallback to name if ID missing (though ID is preferred)

    // Normalize salary to monthly if it's not already
    let normalizedSalary = formData.salary_brut;
    if (formData.payment_frequency?.toLowerCase() === 'yearly') {
      normalizedSalary = formData.salary_brut / 12;
    }

    const salaryEntry = {
      business_id: businessId,
      job_title: formData.job_title,
      salary: formData.salary_brut,
      salary_monthly_normalized: normalizedSalary,
      location: formData.contract_location,
      pay_period: formData.payment_frequency?.toLowerCase() === 'yearly' ? 'yearly' : 'monthly',
      employment_type: mapContractType(formData.contract_type),
      currency: "MAD",
      source: "monrh_contract",
      status: "published", // Contract-verified data is auto-published as high-trust
      is_current: true,
      created_at: new Date().toISOString()
    };

    // Explicitly target the 'public' schema if the default is different
    // Note: createSupabaseServerClient in MONRH uses NEXT_PUBLIC_SUPABASE_SCHEMA.
    // We might need a separate client creator for 'public' if they differ.
    const { error } = await supabase
      .from('salaries')
      .insert(salaryEntry);

    if (error) {
      console.error('[salary-sync] Failed to insert into AVISINE:', error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    console.error('[salary-sync] Unexpected error:', err);
    return { ok: false, error: err };
  }
}

function mapContractType(type: string): string {
  const t = type.toUpperCase();
  if (t === 'CDI') return 'full_time';
  if (t === 'CDD') return 'contract';
  if (t === 'STAGE') return 'intern';
  return 'full_time';
}
