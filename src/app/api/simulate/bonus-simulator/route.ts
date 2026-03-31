import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { bonusSimulatorInputSchema, simulateBonus } from "@/lib/calculators/bonus-simulator";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("bonus_simulator");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = bonusSimulatorInputSchema.parse(payload);
    const result = simulateBonus(input);
    return NextResponse.json({ ok: true, calculatorType: "bonus_simulator", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
