import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("generated_contracts")
      .select(`
        id,
        created_at,
        contract_data,
        template:contract_templates(id, title, contract_type)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      ok: true, 
      items: data.map(item => ({
        id: item.id,
        createdAt: item.created_at,
        contractData: item.contract_data,
        templateId: (item.template as any)?.id,
        templateTitle: (item.template as any)?.title,
        contractType: (item.template as any)?.contract_type
      })) 
    });
  } catch (error) {
    console.error("[api/contracts/user] Fetch error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
