import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { overtimeInputSchema, simulateOvertime } from "@/lib/calculators/overtime";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("overtime");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = overtimeInputSchema.parse(payload);
    const result = simulateOvertime(input);

    return NextResponse.json({
      ok: true,
      calculatorType: "overtime",
      result,
    });
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

