import { NextRequest, NextResponse } from "next/server";
import { getCompanyRiskSummary } from "@/lib/avis-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const companyId = String(params.id || "").trim();

  if (!companyId) {
    return NextResponse.json(
      { companyId: null, riskSummary: null, error: "Invalid company id" },
      { status: 400 },
    );
  }

  try {
    const result = await getCompanyRiskSummary(companyId);
    return NextResponse.json(result, { status: result.riskSummary ? 200 : 404 });
  } catch (error) {
    console.error("[reviewly/companies/:id/risk-summary]", error);
    return NextResponse.json(
      { companyId: null, riskSummary: null, error: "Company risk summary temporarily unavailable" },
      { status: 502 },
    );
  }
}
