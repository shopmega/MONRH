import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { dureePreavisInputSchema, simulateDureePreavis } from "@/lib/calculators/duree-preavis";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("duree_preavis");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = dureePreavisInputSchema.parse(payload);
    const result = simulateDureePreavis(input);
    return NextResponse.json({ ok: true, calculatorType: "duree_preavis", result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid simulation payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

