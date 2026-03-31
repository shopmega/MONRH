import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

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
      .order("category, title");

    if (clausesError) {
      throw new Error(clausesError.message);
    }

    const { data: rules, error: rulesError } = await supabase
      .from("contract_validation_rules")
      .select("*")
      .eq("is_active", true)
      .order("contract_type, rule_type");

    if (rulesError) {
      throw new Error(rulesError.message);
    }

    return NextResponse.json({
      ok: true,
      templates: templates || [],
      clauses: clauses || [],
      validationRules: rules || []
    });
  } catch (error) {
    console.error("Contract templates API error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch contract templates" },
      { status: 500 }
    );
  }
}
