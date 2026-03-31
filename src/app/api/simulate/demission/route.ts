import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { demissionInputSchema, simulateDemission } from "@/lib/calculators/demission";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("demission");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = demissionInputSchema.parse(payload);
    const result = simulateDemission(input);
    return NextResponse.json({ ok: true, calculatorType: "demission", result });
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

