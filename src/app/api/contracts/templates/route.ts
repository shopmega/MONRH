import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getFallbackContractCatalog } from "@/lib/contracts/fallback-catalog";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    
    const { data: templates, error: templatesError } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("is_active", true)
      .order("title");

    if (templatesError) {
      throw new Error(templatesError.message);
    }

    const { data: clauses, error: clausesError } = await supabase
      .from("contract_clauses")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("title");

    if (clausesError) {
      throw new Error(clausesError.message);
    }

    const { data: rules, error: rulesError } = await supabase
      .from("contract_validation_rules")
      .select("*")
      .eq("is_active", true)
      .order("contract_type")
      .order("rule_type");

    if (rulesError) {
      throw new Error(rulesError.message);
    }

    return NextResponse.json({
      ok: true,
      templates: templates || [],
      clauses: clauses || [],
      validationRules: rules || [],
      source: "supabase",
    });
  } catch (error) {
    console.error("Contract templates API error:", error);
    const fallback = getFallbackContractCatalog();
    return NextResponse.json({
      ok: true,
      ...fallback,
      source: "fallback",
      warning: "Supabase contract templates unavailable; using local contract catalog.",
    });
  }
}
