import { NextRequest, NextResponse } from "next/server";
import { getCompanyContextCard } from "@/lib/avis-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const companyId = String(params.id || "").trim();

  if (!companyId) {
    return NextResponse.json(
      { companyId: null, contextCard: null, error: "Invalid company id" },
      { status: 400 },
    );
  }

  try {
    const result = await getCompanyContextCard(companyId);
    return NextResponse.json(result, { status: result.contextCard ? 200 : 404 });
  } catch (error) {
    console.error("[reviewly/companies/:id/context-card]", error);
    return NextResponse.json(
      { companyId: null, contextCard: null, error: "Company context card temporarily unavailable" },
      { status: 502 },
    );
  }
}
