import { NextRequest, NextResponse } from "next/server";
import { getCompanyTrust } from "@/lib/avis-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const companyId = String(params.id || "").trim();

  if (!companyId) {
    return NextResponse.json(
      {
        companyId: null,
        trust: null,
        sources: [],
        assumptions: [],
        missingInformation: ["Invalid company id"],
        signalsSummary: null,
        error: "Invalid company id",
      },
      { status: 400 },
    );
  }

  try {
    const result = await getCompanyTrust(companyId);
    return NextResponse.json(result, { status: result.trust ? 200 : 404 });
  } catch (error) {
    console.error("[reviewly/companies/:id/trust]", error);
    return NextResponse.json(
      {
        companyId: null,
        trust: null,
        sources: [],
        assumptions: [],
        missingInformation: [],
        signalsSummary: null,
        error: "Company trust temporarily unavailable",
      },
      { status: 502 },
    );
  }
}
