import { NextRequest, NextResponse } from "next/server";
import { resolveCompany } from "@/lib/avis-api";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", companyId: null, confidence: "none", candidates: [] },
      { status: 400 },
    );
  }

  const body = payload as { companyName?: string; sourceUrl?: string; city?: string };
  const companyName = body.companyName?.trim() ?? "";

  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is required", companyId: null, confidence: "none", candidates: [] },
      { status: 400 },
    );
  }

  try {
    const result = await resolveCompany({
      companyName,
      sourceUrl: body.sourceUrl,
      city: body.city,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[reviewly/companies/resolve]", error);
    return NextResponse.json(
      { error: "Resolution temporarily unavailable", companyId: null, confidence: "none", candidates: [] },
      { status: 502 },
    );
  }
}
