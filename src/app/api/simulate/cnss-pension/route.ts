import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { cnssPensionInputSchema, simulateCnssPension } from "@/lib/calculators/cnss-pension";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("cnss_pension");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = cnssPensionInputSchema.parse(payload);
    const result = simulateCnssPension(input);
    return NextResponse.json({ ok: true, calculatorType: "cnss_pension", result });
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

