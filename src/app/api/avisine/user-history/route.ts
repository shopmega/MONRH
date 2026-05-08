import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/avisine/user-history
 * Fetches the authenticated user's history from Avisine (public schema).
 */
export async function GET() {
  const adminClient = getSupabaseAdminClient();
  
  // We need a client that explicitly targets the 'public' schema for Avisine data
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "public" } }
  );

  try {
    // 1. Get current MONRH user session
    // Note: In a consolidated project, the auth.uid() is the same.
    const { data: { user }, error: authError } = await adminClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Job Offers from Avisine (public schema)
    const { data: jobOffers, error: jobError } = await publicClient
      .from("job_offers")
      .select("id, company_name, job_title, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 3. Fetch Reviews from Avisine (public schema)
    const { data: reviews, error: reviewError } = await publicClient
      .from("reviews")
      .select("id, business_id, rating, comment, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      jobOffers: jobOffers || [],
      reviews: reviews || [],
      stats: {
        jobCount: jobOffers?.length || 0,
        reviewCount: reviews?.length || 0,
      }
    });
  } catch (error) {
    console.error("[api/avisine/user-history] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
