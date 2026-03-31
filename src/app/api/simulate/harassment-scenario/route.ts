import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  harassmentScenarioInputSchema,
  simulateHarassmentScenario,
} from "@/lib/calculators/harassment-scenario";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("harassment_scenario");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = harassmentScenarioInputSchema.parse(payload);
    const result = simulateHarassmentScenario(input);
    return NextResponse.json({ ok: true, calculatorType: "harassment_scenario", result });
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

