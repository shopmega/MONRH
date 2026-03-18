import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { hiringCostInputSchema, simulateHiringCost } from "@/lib/calculators/hiring-cost";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("hiring_cost");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = hiringCostInputSchema.parse(payload);
    const result = simulateHiringCost(input);
    return NextResponse.json({ ok: true, calculatorType: "hiring_cost", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
