import { NextRequest, NextResponse } from "next/server";
import { getCompanyById } from "@/lib/avis-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const companyId = String(params.id || "").trim();

  if (!companyId) {
    return NextResponse.json(
      { company: null, error: "Invalid company id" },
      { status: 400 },
    );
  }

  try {
    const result = await getCompanyById(companyId);
    return NextResponse.json(result, { status: result.company ? 200 : 404 });
  } catch (error) {
    console.error("[reviewly/companies/:id]", error);
    return NextResponse.json(
      { company: null, error: "Company context temporarily unavailable" },
      { status: 502 },
    );
  }
}
